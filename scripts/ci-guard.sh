#!/bin/bash
# CI Guard Script - Prevents legacy Firebase client imports

set -e

echo "🔍 Checking for legacy Firebase client imports..."

# Check for legacy firebase client imports
if grep -R -n --exclude-dir node_modules -E 'lib/firebase/client(?!\.)' src 2>/dev/null; then
    echo "❌ ERROR: Legacy Firebase client import found"
    echo "   Please use '~/lib/firebase.client' instead of '~/lib/firebase/client'"
    exit 1
fi

# Check for NEXT_PUBLIC_FIREBASE_* usage in client code
if grep -R -n --exclude-dir node_modules -E 'NEXT_PUBLIC_FIREBASE_' src | grep -v "env-client\|env.js\|env-wrapper" | grep -v "TEMPLATE_"; then
    echo "❌ ERROR: NEXT_PUBLIC_FIREBASE_* environment variables found in client code"
    echo "   Please use runtime configuration via /api/public-config instead"
    exit 1
fi

echo "✅ No legacy Firebase client imports found"
echo "✅ No NEXT_PUBLIC_FIREBASE_* usage in client code"
