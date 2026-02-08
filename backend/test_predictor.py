#!/usr/bin/env python
"""Test predictor initialization"""
import sys
import os

print("[1] Starting test...")
sys.stdout.flush()

try:
    print("[2] Importing custom_predict...")
    sys.stdout.flush()
    from custom_predict import CustomMushroomPredictor
    
    print("[3] Creating predictor...")
    sys.stdout.flush()
    p = CustomMushroomPredictor()
    
    print("[4] SUCCESS - Predictor loaded!")
    sys.stdout.flush()
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.stdout.flush()
