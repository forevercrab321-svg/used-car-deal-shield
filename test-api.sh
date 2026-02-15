
#!/bin/bash

# Configuration
API_URL="http://localhost:54321/functions/v1/api" # Local Supabase or deployed URL
# API_URL="https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/api"

EMAIL="test@example.com"
ZIP="90210"

echo "Note: Ensure you have a user with email '$EMAIL' in Supabase Auth or the script may fail login."
echo "Running against: $API_URL"
echo "---------------------------------------------------"

# 1. Login
echo "1. Logging in..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN_RES"
  exit 1
fi
echo "Success! Token: ${TOKEN:0:10}..."

# 2. Presign
echo "---------------------------------------------------"
echo "2. Getting Upload URL..."
PRESIGN_RES=$(curl -s -X POST "$API_URL/files/presign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")

UPLOAD_URL=$(echo $PRESIGN_RES | grep -o '"uploadUrl":"[^"]*' | cut -d'"' -f4)
FILE_URL=$(echo $PRESIGN_RES | grep -o '"fileUrl":"[^"]*' | cut -d'"' -f4)

if [ -z "$UPLOAD_URL" ]; then
  echo "Presign failed. Response: $PRESIGN_RES"
  exit 1
fi
echo "Upload URL obtained."

# 3. Upload (Simulate PUT)
echo "---------------------------------------------------"
echo "3. Uploading dummy file..."
# Create dummy pdf
echo "dummy content" > test.pdf
curl -s -X PUT "$UPLOAD_URL" -H "Content-Type: application/pdf" --data-binary @test.pdf
rm test.pdf
echo "File uploaded."

# 4. Confirm
echo "---------------------------------------------------"
echo "4. Confirming upload..."
CONFIRM_RES=$(curl -s -X POST "$API_URL/files/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileUrl\": \"$FILE_URL\"}")
FILE_ID=$(echo $CONFIRM_RES | grep -o '"fileId":"[^"]*' | cut -d'"' -f4)
echo "File confirmed: $FILE_ID"

# 5. Parse
echo "---------------------------------------------------"
echo "5. Parsing deal..."
PARSE_RES=$(curl -s -X POST "$API_URL/deals/parse" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileId\": \"$FILE_ID\", \"zip\": \"$ZIP\"}")

DEAL_ID=$(echo $PARSE_RES | grep -o '"dealId":"[^"]*' | cut -d'"' -f4)
echo "Deal Parsed. ID: $DEAL_ID"
echo "Preview: $(echo $PARSE_RES | grep -o '"preview":{[^}]*}')"

# 6. Checkout
echo "---------------------------------------------------"
echo "6. Creating Checkout Session..."
CHECKOUT_RES=$(curl -s -X POST "$API_URL/billing/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"dealId\": \"$DEAL_ID\"}")

CHECKOUT_URL=$(echo $CHECKOUT_RES | grep -o '"checkoutUrl":"[^"]*' | cut -d'"' -f4)
echo "Checkout URL: $CHECKOUT_URL"

# 7. Webhook Simulation
echo "---------------------------------------------------"
echo "7. Simulating Webhook (Skipped - hard to mock signature in bash)"
echo "   Run: stripe trigger checkout.session.completed --add checkout_session:metadata.dealId=$DEAL_ID"
echo "   Or manually update DB: update deals set paid=true where id='$DEAL_ID';"

# 8. Status
echo "---------------------------------------------------"
echo "8. Checking Status..."
STATUS_RES=$(curl -s -X GET "$API_URL/billing/status?dealId=$DEAL_ID")
echo "Status: $STATUS_RES"

# 9. Analyze
echo "---------------------------------------------------"
echo "9. Analyzing Deal..."
ANALYZE_RES=$(curl -s -X POST "$API_URL/deals/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"dealId\": \"$DEAL_ID\"}")

echo "Analysis Result: $ANALYZE_RES"
echo "---------------------------------------------------"
echo "Done."
