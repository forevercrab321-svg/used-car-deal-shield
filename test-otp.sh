#!/bin/bash

# Configuration
API_URL="https://ywvhpxqfapjjfxhccqxu.supabase.co/functions/v1/api"
# Use random email to avoid rate limits during testing
RANDOM_ID=$(date +%s)
EMAIL="test-${RANDOM_ID}@example.com"
CODE="123456"

echo "Running OTP Test against: $API_URL"
echo "---------------------------------------------------"

# 1. Send OTP
echo "1. Sending OTP to $EMAIL..."
SEND_RES=$(curl -s -X POST "$API_URL/auth/otp/send" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Response: $SEND_RES"

# Check for success (simple grep)
if echo "$SEND_RES" | grep -q "true"; then
  echo "✅ OTP Sent successfully."
else
  echo "❌ Failed to send OTP."
  exit 1
fi

echo "---------------------------------------------------"

# 2. Verify OTP
echo "2. Verifying OTP ($CODE)..."
VERIFY_RES=$(curl -s -X POST "$API_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"code\": \"$CODE\"}")

# Extract Token
TOKEN=$(echo $VERIFY_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Login Successful!"
  echo "Token: ${TOKEN:0:15}..."
else
  echo "❌ Login Failed."
  echo "Response: $VERIFY_RES"
  exit 1
fi

echo "---------------------------------------------------"
echo "Test Complete."
