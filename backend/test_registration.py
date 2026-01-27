#!/usr/bin/env python3
"""
Test script for user registration endpoint
Verifies MongoDB connection and user registration functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000/api"
REGISTER_URL = f"{API_BASE_URL}/auth/register"
LOGIN_URL = f"{API_BASE_URL}/auth/login"

# Test data
TEST_USER = {
    "username": f"testuser_{int(time.time())}",
    "email": f"testuser_{int(time.time())}@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
}

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def test_registration():
    """Test user registration endpoint"""
    print_header("Testing User Registration")
    
    print(f"\nTest User Data:")
    print(f"  Username: {TEST_USER['username']}")
    print(f"  Email: {TEST_USER['email']}")
    print(f"  Name: {TEST_USER['name']}")
    
    try:
        print(f"\n📤 Sending registration request to {REGISTER_URL}...")
        
        response = requests.post(
            REGISTER_URL,
            json=TEST_USER,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"Response Body:\n{json.dumps(response_data, indent=2)}")
        except:
            print(f"Response Body (raw):\n{response.text}")
            return False
        
        if response.status_code == 201:
            print_success("User registration successful!")
            
            # Verify response structure
            if "user" in response_data and "access_token" in response_data:
                user_data = response_data["user"]
                print(f"\nUser Details:")
                print(f"  ID: {user_data.get('id')}")
                print(f"  Username: {user_data.get('username')}")
                print(f"  Email: {user_data.get('email')}")
                print(f"  Name: {user_data.get('name')}")
                print(f"  Created: {user_data.get('created_at')}")
                print(f"  Subscription: {user_data.get('subscription')}")
                
                print_success("Response structure is valid!")
                return True, response_data
            else:
                print_error("Response structure missing required fields")
                return False, response_data
        
        elif response.status_code == 409:
            print_error("User already exists (duplicate key)")
            return False, response_data
        
        elif response.status_code == 400:
            print_error("Bad request - validation error")
            print(f"  Error: {response_data.get('error')}")
            return False, response_data
        
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False, response_data
            
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to API server")
        print_info("Make sure the Flask server is running on http://localhost:5000")
        return False, None
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False, None

def test_duplicate_registration(user_data):
    """Test that duplicate registration is rejected"""
    print_header("Testing Duplicate Registration Prevention")
    
    print(f"Attempting to register the same user again...")
    
    try:
        response = requests.post(
            REGISTER_URL,
            json={
                "username": user_data["user"]["username"],
                "email": user_data["user"]["email"],
                "password": "DifferentPassword123!"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 409:
            print_success("Duplicate registration correctly rejected!")
            return True
        else:
            print_error(f"Expected 409, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_login(email, password):
    """Test user login with registered credentials"""
    print_header("Testing User Login")
    
    print(f"Attempting login with email: {email}")
    
    try:
        response = requests.post(
            LOGIN_URL,
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 200:
            print_success("Login successful!")
            return True, response_data
        else:
            print_error(f"Login failed with status {response.status_code}")
            return False, response_data
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False, None

def test_invalid_credentials():
    """Test login with invalid credentials"""
    print_header("Testing Invalid Credentials")
    
    try:
        response = requests.post(
            LOGIN_URL,
            json={"email": "invalid@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {json.dumps(response_data, indent=2)}")
        
        if response.status_code == 401:
            print_success("Invalid credentials correctly rejected!")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_validation_errors():
    """Test input validation"""
    print_header("Testing Input Validation")
    
    test_cases = [
        {
            "name": "Missing email",
            "data": {"username": "testuser", "password": "password123"}
        },
        {
            "name": "Missing password",
            "data": {"username": "testuser", "email": "test@example.com"}
        },
        {
            "name": "Invalid email format",
            "data": {"username": "testuser", "email": "notanemail", "password": "password123"}
        },
        {
            "name": "Short password",
            "data": {"username": "testuser", "email": "test@example.com", "password": "123"}
        },
        {
            "name": "Short username",
            "data": {"username": "ab", "email": "test@example.com", "password": "password123"}
        }
    ]
    
    passed = 0
    for test_case in test_cases:
        try:
            response = requests.post(
                REGISTER_URL,
                json=test_case["data"],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                print_success(f"'{test_case['name']}' correctly rejected")
                passed += 1
            else:
                print_error(f"'{test_case['name']}' - Expected 400, got {response.status_code}")
        except Exception as e:
            print_error(f"'{test_case['name']}' - Request failed: {str(e)}")
    
    print(f"\nValidation tests passed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  SnapShroom User Registration Test Suite")
    print("="*60)
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = {
        "registration": False,
        "duplicate_prevention": False,
        "login": False,
        "invalid_credentials": False,
        "validation": False
    }
    
    # Test 1: Basic registration
    success, reg_response = test_registration()
    test_results["registration"] = success
    
    if not success:
        print_error("Registration test failed, skipping dependent tests")
        print_header("Test Summary")
        print(f"Tests passed: {sum(test_results.values())}/{len(test_results)}")
        return
    
    # Test 2: Duplicate registration prevention
    test_results["duplicate_prevention"] = test_duplicate_registration(reg_response)
    
    # Test 3: Login with registered credentials
    success, login_response = test_login(TEST_USER['email'], TEST_USER['password'])
    test_results["login"] = success
    
    # Test 4: Invalid credentials
    test_results["invalid_credentials"] = test_invalid_credentials()
    
    # Test 5: Input validation
    test_results["validation"] = test_validation_errors()
    
    # Summary
    print_header("Test Summary")
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.ljust(30)}: {status}")
    
    total_passed = sum(test_results.values())
    total_tests = len(test_results)
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print_success("All tests passed!")
    else:
        print_error(f"{total_tests - total_passed} test(s) failed")

if __name__ == "__main__":
    main()
