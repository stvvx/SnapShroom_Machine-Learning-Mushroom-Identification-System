#!/usr/bin/env python3
"""
Test script to verify SnapShroom API endpoints are working correctly.
"""

import requests
import json
import base64
from PIL import Image
import io

def test_home_endpoint():
    """Test the home endpoint."""
    try:
        response = requests.get('http://127.0.0.1:5000/')
        print(f"Home endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Models available: {data.get('models_available')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Home endpoint error: {e}")
        return False

def test_dataset_info():
    """Test dataset info endpoint."""
    try:
        response = requests.get('http://127.0.0.1:5000/api/dataset/info')
        print(f"Dataset info: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total species: {data.get('total_species')}")
            print(f"Training samples: {data.get('training_samples')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Dataset info error: {e}")
        return False

def test_species_list():
    """Test species list endpoint."""
    try:
        response = requests.get('http://127.0.0.1:5000/api/dataset/species')
        print(f"Species list: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Species count: {data.get('count')}")
            if data.get('species'):
                print(f"First species: {data['species'][0].get('english_name')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Species list error: {e}")
        return False

def create_test_image():
    """Create a simple test image."""
    # Create a simple colored square as test image
    img = Image.new('RGB', (224, 224), color=(128, 128, 128))
    # Add some variation
    for x in range(100, 150):
        for y in range(100, 150):
            img.putpixel((x, y), (200, 100, 100))

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return img_base64

def test_prediction_endpoint():
    """Test the comprehensive prediction endpoint."""
    try:
        test_image = create_test_image()
        payload = {
            "image_base64": test_image,
            "location": {
                "region": "Region 4A",
                "province": "Laguna"
            },
            "date": "2024-01-24",
            "user_context": {
                "experience_level": "intermediate",
                "purpose": "identification"
            }
        }

        response = requests.post(
            'http://127.0.0.1:5000/api/toxicity/predict',
            json=payload,
            timeout=30
        )

        print(f"Prediction endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Analysis timestamp: {data.get('timestamp')}")
            risk = data.get('risk_assessment', {})
            print(f"Risk level: {risk.get('risk_level')}")
            print(f"Recommendations count: {len(data.get('recommendations', []))}")
            return True
        else:
            print(f"Error response: {response.text}")
            return False

    except Exception as e:
        print(f"Prediction endpoint error: {e}")
        return False

def main():
    """Run all tests."""
    print("=== SnapShroom API Test Suite ===\n")

    tests = [
        ("Home Endpoint", test_home_endpoint),
        ("Dataset Info", test_dataset_info),
        ("Species List", test_species_list),
        ("Prediction Endpoint", test_prediction_endpoint),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"Testing {test_name}...")
        if test_func():
            print(f"✓ {test_name} PASSED\n")
            passed += 1
        else:
            print(f"✗ {test_name} FAILED\n")

    print(f"=== Results: {passed}/{total} tests passed ===")

    if passed == total:
        print("🎉 All tests passed! SnapShroom backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the backend logs.")

if __name__ == "__main__":
    main()