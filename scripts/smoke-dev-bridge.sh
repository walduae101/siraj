#!/usr/bin/env bash
set -euo pipefail
echo '→ public-config proxied'
curl -sS -H 'Accept: application/json' http://localhost:3001/api/dev-proxy/public-config | head -c 200; echo
echo '→ local public-config'
curl -sS -H 'Accept: application/json' http://localhost:3001/api/public-config | head -c 200; echo
echo '→ guard check (expect 403)'
curl -si -H 'Host: example.com' http://localhost:3001/api/dev-proxy/public-config | head -n 1
