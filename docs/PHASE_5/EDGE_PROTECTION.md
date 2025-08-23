# Edge Protection: Cloud Armor & WAF

**Phase 5 Implementation Guide**

## Overview

This document outlines the edge protection setup using Google Cloud Armor and Web Application Firewall (WAF) to protect the PayNow webhook system from abuse and attacks.

## Architecture

```
Internet → Cloud Load Balancer → Cloud Armor → Cloud Run (Webhook Service)
                ↓
         OWASP CRS Rules + Rate Limiting
```

## Cloud Armor Policy Configuration

### 1. Load Balancer Setup

If not already fronted by HTTPS LB:

1. **Create Serverless NEG**:
   ```bash
   gcloud compute network-endpoint-groups create siraj-webhook-neg \
     --region=us-central1 \
     --network-endpoint-type=serverless \
     --cloud-run-service=siraj-webhook
   ```

2. **Create Backend Service**:
   ```bash
   gcloud compute backend-services create siraj-webhook-backend \
     --global \
     --enable-cdn \
     --network-endpoint-group=siraj-webhook-neg \
     --network-endpoint-group-region=us-central1
   ```

3. **Create URL Map**:
   ```bash
   gcloud compute url-maps create siraj-webhook-urlmap \
     --default-service=siraj-webhook-backend
   ```

4. **Create HTTPS Proxy**:
   ```bash
   gcloud compute target-https-proxies create siraj-webhook-https-proxy \
     --url-map=siraj-webhook-urlmap \
     --ssl-certificates=siraj-ssl-cert
   ```

5. **Create Global Forwarding Rule**:
   ```bash
   gcloud compute forwarding-rules create siraj-webhook-forwarding-rule \
     --global \
     --target-https-proxy=siraj-webhook-https-proxy \
     --ports=443
   ```

### 2. Cloud Armor Policy

**Policy Name**: `siraj-webhook-armor-policy`

#### OWASP CRS Rules
- Enable preconfigured **OWASP CRS v3.2** rules
- Action: **Deny (403)**
- Priority: **1000**

#### Rate-Based Rules

**Webhook Endpoint Protection**:
- **Path**: `/api/paynow/webhook`
- **Rate Limit**: 300 RPM per source IP
- **Action**: Deny (429)
- **Priority**: 2000
- **Allowlist**: PayNow IP ranges (if published)
- **Custom Rule**: Require valid HMAC signature header

**API Protection**:
- **Path**: `/api/trpc/*` and `/api/auth/*`
- **Rate Limit**: 120 RPM/IP, burst 60
- **Action**: Deny (429)
- **Priority**: 2100

**Anonymous Endpoints**:
- **Path**: `/api/paywall*`
- **Rate Limit**: 60 RPM/IP, burst 30
- **Action**: Deny (429)
- **Priority**: 2200

#### Logging Configuration
- **Log Level**: 100% sampling
- **Log Location**: Cloud Logging
- **Log Filter**: All requests (including allowed)

### 3. reCAPTCHA Enterprise Integration

**High-Risk Forms**:
- User signup
- Promo code redemption
- Admin wallet adjustments

**Configuration**:
- **Action**: `signup`, `promo_redeem`, `admin_adjust`
- **Score Threshold**: 0.5 (configurable per action)
- **Site Key**: Environment-specific

## Implementation Steps

### Step 1: Create Cloud Armor Policy

```bash
# Create the policy
gcloud compute security-policies create siraj-webhook-armor-policy \
  --description="PayNow webhook protection policy"

# Add OWASP CRS rules
gcloud compute security-policies rules update 1000 \
  --security-policy=siraj-webhook-armor-policy \
  --expression="evaluatePreconfiguredExpr('owasp-crs-v030301')" \
  --action="deny-403"

# Add webhook rate limiting
gcloud compute security-policies rules create 2000 \
  --security-policy=siraj-webhook-armor-policy \
  --expression="request.path.matches('/api/paynow/webhook') && rateBasedEval('300', '60s')" \
  --action="deny-429"

# Add API rate limiting
gcloud compute security-policies rules create 2100 \
  --security-policy=siraj-webhook-armor-policy \
  --expression="request.path.matches('/api/trpc/.*') && rateBasedEval('120', '60s')" \
  --action="deny-429"

# Add anonymous rate limiting
gcloud compute security-policies rules create 2200 \
  --security-policy=siraj-webhook-armor-policy \
  --expression="request.path.matches('/api/paywall.*') && rateBasedEval('60', '60s')" \
  --action="deny-429"
```

### Step 2: Attach Policy to Backend Service

```bash
gcloud compute backend-services update siraj-webhook-backend \
  --global \
  --security-policy=siraj-webhook-armor-policy
```

### Step 3: Enable Logging

```bash
gcloud compute security-policies update siraj-webhook-armor-policy \
  --enable-logging
```

## Monitoring & Alerts

### Metrics to Monitor
- **Requests blocked by Cloud Armor**
- **Rate limiting triggers**
- **OWASP rule violations**
- **reCAPTCHA scores**

### Alerts
- **Rate limit blocks** > 50 in 5m (info)
- **OWASP violations** > 10 in 10m (warning)
- **reCAPTCHA failures** > 20% in 5m (warning)

## Dry-Run Mode

### Initial Deployment (24h dry-run)
```bash
# Set policy to preview mode
gcloud compute security-policies update siraj-webhook-armor-policy \
  --preview-mode
```

### Monitor for 24 hours
- Check logs for false positives
- Verify legitimate traffic not blocked
- Adjust thresholds if needed

### Enable Enforcement
```bash
# Disable preview mode
gcloud compute security-policies update siraj-webhook-armor-policy \
  --no-preview-mode
```

## Rollback Procedure

### Emergency Rollback
```bash
# Remove security policy from backend
gcloud compute backend-services update siraj-webhook-backend \
  --global \
  --no-security-policy

# Or disable specific rules
gcloud compute security-policies rules update 2000 \
  --security-policy=siraj-webhook-armor-policy \
  --action="allow"
```

### Gradual Rollback
1. Set policy to preview mode
2. Monitor for 1 hour
3. If issues persist, remove policy entirely

## Performance Impact

### Expected Metrics
- **Latency increase**: <5ms (Cloud Armor overhead)
- **Throughput**: No impact on legitimate traffic
- **Webhook ACK**: Maintain <250ms p95

### Monitoring Queries

**Rate Limit Blocks**:
```sql
resource.type="gce_backend_service"
resource.labels.backend_service_name="siraj-webhook-backend"
jsonPayload.enforcedSecurityPolicy.name="siraj-webhook-armor-policy"
jsonPayload.enforcedSecurityPolicy.outcome="DENY"
```

**OWASP Violations**:
```sql
resource.type="gce_backend_service"
jsonPayload.enforcedSecurityPolicy.name="siraj-webhook-armor-policy"
jsonPayload.enforcedSecurityPolicy.outcome="DENY"
jsonPayload.enforcedSecurityPolicy.ruleId="1000"
```

## Security Considerations

### IP Allowlisting
- **PayNow IPs**: Add to allowlist if published
- **Admin IPs**: Restrict admin endpoints to office IPs
- **Monitoring**: Log all blocked requests for analysis

### HMAC Verification
- **Belt-and-suspenders**: Cloud Armor + application-level verification
- **Header validation**: Ensure required headers present
- **Signature verification**: Validate HMAC before processing

### Rate Limit Tuning
- **Start conservative**: Lower limits initially
- **Monitor patterns**: Adjust based on legitimate usage
- **Whitelist exceptions**: For known good actors

## Configuration Files

### Terraform Configuration (Optional)
```hcl
resource "google_compute_security_policy" "webhook_armor" {
  name = "siraj-webhook-armor-policy"
  
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('owasp-crs-v030301')"
      }
    }
  }
  
  rule {
    action   = "deny(429)"
    priority = "2000"
    match {
      expr {
        expression = "request.path.matches('/api/paynow/webhook') && rateBasedEval('300', '60s')"
      }
    }
  }
}
```

## Testing

### Load Testing
```bash
# Test rate limiting
ab -n 1000 -c 10 -H "X-PayNow-Signature: test" https://your-domain.com/api/paynow/webhook

# Test OWASP rules
curl -X POST https://your-domain.com/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -d '{"script": "<script>alert(1)</script>"}'
```

### Validation Checklist
- [ ] Cloud Armor policy created and attached
- [ ] Rate limiting rules configured
- [ ] OWASP CRS rules enabled
- [ ] Logging enabled at 100%
- [ ] Dry-run mode active for 24h
- [ ] Monitoring alerts configured
- [ ] Rollback procedure tested
- [ ] Performance impact measured

## Troubleshooting

### Common Issues

**False Positives**:
- Check logs for blocked legitimate requests
- Adjust rate limits or add IP allowlists
- Review OWASP rule triggers

**Performance Issues**:
- Monitor Cloud Armor latency
- Check backend service health
- Verify load balancer configuration

**Configuration Errors**:
- Validate policy syntax
- Check backend service attachment
- Verify logging configuration

---

**Last Updated**: January 2025  
**Maintainer**: Security Team
