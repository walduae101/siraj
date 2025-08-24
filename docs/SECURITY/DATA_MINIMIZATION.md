# Data Minimization & Privacy

## Overview
This document outlines the data minimization practices and privacy controls implemented in the Siraj platform, particularly for fraud detection and payment processing.

## Hashing & Salt Governance

### Current Salt Configuration
- **Secret Name**: `siraj-fraud-hash-salt`
- **Version ID**: `projects/siraj-prod/secrets/siraj-fraud-hash-salt/versions/3`
- **Algorithm**: SHA-256 with keyed salt
- **Rotation Schedule**: Quarterly (every 3 months)

### Data Fields Hashed
1. **IP Addresses**
   - Purpose: Rate limiting and velocity checks
   - Hash: `SHA256(ip + salt)`
   - Retention: 90 days in `riskDecisions`

2. **Card BIN Numbers**
   - Purpose: Fraud pattern detection
   - Hash: `SHA256(bin + salt)`
   - Retention: 90 days in `riskDecisions`

3. **Email Domains**
   - Purpose: Domain reputation scoring
   - Hash: `SHA256(domain + salt)`
   - Retention: 90 days in `riskDecisions`

### Salt Rotation Process

#### Quarterly Rotation (7-day overlap)
1. **Day 1**: Generate new salt version in Secret Manager
2. **Day 1-7**: Accept both old and new salts for hashing
3. **Day 8**: Deprecate old salt, use only new salt
4. **Day 15**: Delete old salt version

#### Implementation
```typescript
// Salt rotation logic
async function hashWithSalt(data: string, saltVersion?: string): Promise<string> {
  const currentSalt = await getSecret('siraj-fraud-hash-salt', saltVersion || 'latest');
  const oldSalt = await getSecret('siraj-fraud-hash-salt', 'previous');
  
  // Try current salt first
  try {
    return await hash(data + currentSalt);
  } catch (error) {
    // Fallback to old salt during rotation period
    if (oldSalt) {
      return await hash(data + oldSalt);
    }
    throw error;
  }
}
```

### Rotation Schedule
- **Q1 2025**: January 15th
- **Q2 2025**: April 15th
- **Q3 2025**: July 15th
- **Q4 2025**: October 15th

### Compliance
- **GDPR**: Article 25 (Data Protection by Design)
- **CCPA**: Section 1798.100 (General Duties of Businesses)
- **SOC 2**: CC6.1 (Logical Access Security)

## Data Retention

### Fraud Detection Data
- **riskDecisions**: 90 days (TTL enabled)
- **fraudSignals**: 30 days
- **manualReviews**: 1 year
- **denylist/allowlist**: Indefinite (until removed)

### Payment Data
- **Transaction IDs**: Retained for compliance
- **Amounts**: Retained for compliance
- **Timestamps**: Retained for compliance
- **Personal Data**: Minimized and hashed

### Log Data
- **Application Logs**: 30 days
- **Access Logs**: 90 days
- **Audit Logs**: 1 year

## Privacy Controls

### Data Minimization
- Only collect data necessary for fraud detection
- Hash sensitive fields before storage
- Use TTL for automatic data deletion
- Implement least-privilege access controls

### Access Controls
- Admin-only access to fraud data
- Service account access for automated processes
- Audit logging for all data access
- Regular access reviews

### User Rights
- Right to deletion: Remove from allowlist/denylist
- Right to access: View own fraud decisions (admin only)
- Right to rectification: Update allowlist entries
- Right to portability: Export own data (admin only)

## Monitoring & Compliance

### Data Access Monitoring
- Log all access to fraud data
- Alert on unusual access patterns
- Regular compliance audits
- Annual privacy impact assessments

### Incident Response
- Data breach notification within 72 hours
- Immediate salt rotation on suspected compromise
- Forensic analysis and containment
- Regulatory reporting as required
