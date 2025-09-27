#!/bin/bash

# Script untuk testing semua API endpoints Rice Mill Management
echo "🚀 Rice Mill Management API Testing Script"
echo "========================================="

BASE_URL="http://localhost:3001"
TOKEN=""

# Fungsi untuk mencetak hasil dengan warna
print_result() {
    if [[ $1 -eq 0 ]]; then
        echo -e "✅ $2"
    else
        echo -e "❌ $2"
    fi
}

# Fungsi untuk menjalankan curl dan menangani error
run_curl() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo ""
    echo "🔍 Testing: $description"
    echo "📞 $method $endpoint"
    
    if [[ -n "$data" && -n "$headers" ]]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "$headers" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [[ -n "$headers" ]]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "$headers")
    elif [[ -n "$data" ]]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status code
    http_code=$(echo $response | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
    # Extract response body
    response_body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    echo "📄 Response ($http_code): $response_body"
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_result 0 "$description - Success"
        return 0
    else
        print_result 1 "$description - Failed (HTTP $http_code)"
        return 1
    fi
}

# Test 1: Health Check
echo ""
echo "🏥 HEALTH CHECK TESTS"
echo "===================="
run_curl "GET" "/health" "" "" "Health Check"

# Test 2: Authentication Tests
echo ""
echo "🔐 AUTHENTICATION TESTS"
echo "======================"

# Register Admin User
run_curl "POST" "/api/auth/register" '{
    "username": "admin",
    "password": "admin123",
    "role": "admin"
}' "" "Register Admin User"

# Register Manager User
run_curl "POST" "/api/auth/register" '{
    "username": "manager",
    "password": "manager123",
    "role": "manager"
}' "" "Register Manager User"

# Login Admin
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

http_code=$(echo $response | grep -o 'HTTPSTATUS:[0-9]*' | cut -d: -f2)
response_body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo ""
echo "🔍 Testing: Admin Login"
echo "📞 POST /api/auth/login"
echo "📄 Response ($http_code): $response_body"

if [[ $http_code -eq 200 ]]; then
    # Extract token (assuming it's in JSON format)
    TOKEN=$(echo $response_body | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 Token extracted: $TOKEN"
    print_result 0 "Admin Login - Success"
else
    print_result 1 "Admin Login - Failed (HTTP $http_code)"
fi

# Test 3: Supplier Management Tests
echo ""
echo "🏪 SUPPLIER MANAGEMENT TESTS"
echo "============================"

# Create Supplier
run_curl "POST" "/api/suppliers" '{
    "name": "Supplier Test",
    "contact_person": "John Doe",
    "phone": "081234567890",
    "address": "Jl. Test No. 123",
    "status": "active"
}' "Authorization: Bearer $TOKEN" "Create Supplier"

# Get All Suppliers
run_curl "GET" "/api/suppliers" "" "Authorization: Bearer $TOKEN" "Get All Suppliers"

# Test 4: User Management Tests
echo ""
echo "👥 USER MANAGEMENT TESTS"
echo "======================="

# Get All Users (Admin only)
run_curl "GET" "/api/users" "" "Authorization: Bearer $TOKEN" "Get All Users"

# Get User Profile
run_curl "GET" "/api/users/profile" "" "Authorization: Bearer $TOKEN" "Get User Profile"

# Test 5: Purchase Management Tests
echo ""
echo "📦 PURCHASE MANAGEMENT TESTS"
echo "============================"

# Create Purchase
run_curl "POST" "/api/purchases" '{
    "date": "2023-09-27",
    "supplier_id": 1,
    "supplier": "Supplier Test",
    "quantity": 100,
    "weight": 5000.00,
    "price": 15000000.00,
    "truck_cost": 500000.00,
    "labor_cost": 200000.00
}' "Authorization: Bearer $TOKEN" "Create Purchase"

# Get All Purchases
run_curl "GET" "/api/purchases" "" "Authorization: Bearer $TOKEN" "Get All Purchases"

# Get Purchase Statistics
run_curl "GET" "/api/purchases/statistics" "" "Authorization: Bearer $TOKEN" "Get Purchase Statistics"

# Test 6: Sales Management Tests
echo ""
echo "💰 SALES MANAGEMENT TESTS"
echo "========================="

# Create Sale
run_curl "POST" "/api/sales" '{
    "date": "2023-09-28",
    "purchase_id": 1,
    "quantity": 80,
    "weight": 4000.00,
    "price": 20000000.00,
    "pellet": 100000.00,
    "fuel": 150000.00,
    "labor": 100000.00
}' "Authorization: Bearer $TOKEN" "Create Sale"

# Get All Sales
run_curl "GET" "/api/sales" "" "Authorization: Bearer $TOKEN" "Get All Sales"

# Get Sales Statistics
run_curl "GET" "/api/sales/statistics" "" "Authorization: Bearer $TOKEN" "Get Sales Statistics"

# Test 7: Invoice Management Tests
echo ""
echo "🧾 INVOICE MANAGEMENT TESTS"
echo "==========================="

# Create Invoice
run_curl "POST" "/api/invoices" '{
    "invoice_number": "INV-001",
    "date": "2023-09-28",
    "customer": "Customer Test",
    "amount": 20000000.00,
    "due_date": "2023-10-28",
    "status": "unpaid"
}' "Authorization: Bearer $TOKEN" "Create Invoice"

# Get All Invoices
run_curl "GET" "/api/invoices" "" "Authorization: Bearer $TOKEN" "Get All Invoices"

# Get Invoice Statistics
run_curl "GET" "/api/invoices/statistics" "" "Authorization: Bearer $TOKEN" "Get Invoice Statistics"

# Get Aging Report
run_curl "GET" "/api/invoices/aging-report" "" "Authorization: Bearer $TOKEN" "Get Aging Report"

echo ""
echo "🎉 API Testing Completed!"
echo "========================"