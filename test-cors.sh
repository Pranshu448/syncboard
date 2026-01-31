#!/bin/bash

# CORS Test Script for SyncBoard
# Run this to test if CORS is working correctly

echo "🧪 Testing CORS Configuration..."
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Backend Health..."
curl -s https://syncboard-jirc.onrender.com/health | jq '.'
echo ""

# Test 2: OPTIONS Preflight Request
echo "2️⃣ Testing CORS Preflight (OPTIONS)..."
curl -X OPTIONS https://syncboard-jirc.onrender.com/api/auth/login \
  -H "Origin: https://syncboard-sigma.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v 2>&1 | grep -i "access-control"
echo ""

# Test 3: Actual POST Request
echo "3️⃣ Testing Actual Login Request..."
curl -X POST https://syncboard-jirc.onrender.com/api/auth/login \
  -H "Origin: https://syncboard-sigma.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -v 2>&1 | grep -i "access-control"
echo ""

echo "✅ Test Complete!"
echo ""
echo "Expected Headers:"
echo "  - Access-Control-Allow-Origin: https://syncboard-sigma.vercel.app"
echo "  - Access-Control-Allow-Credentials: true"
echo "  - Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS"
