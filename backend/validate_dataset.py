#!/usr/bin/env python3
"""
Validate the mushrooms.csv dataset to ensure it's properly formatted.
"""

import pandas as pd
import os

def validate_dataset(csv_path='mushrooms.csv'):
    """Validate the mushroom dataset CSV file."""
    
    print("=" * 60)
    print("SnapShroom Dataset Validation")
    print("=" * 60)
    
    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV file not found at {csv_path}")
        return False
    
    try:
        df = pd.read_csv(csv_path)
        print(f"[OK] CSV file loaded successfully")
        print(f"   Total rows: {len(df)}")
        print(f"   Total columns: {len(df.columns)}")
    except Exception as e:
        print(f"[ERROR] Failed to read CSV file: {e}")
        return False
    
    # Required columns
    required_columns = [
        'mushroom_id', 'english_name', 'local_name', 'scientific_name',
        'edible', 'poisonous', 'location_region', 'location_province',
        'habitat', 'cap_color', 'cap_size_cm', 'season_month', 'notes'
    ]
    
    print("\n[CHECK] Required columns...")
    missing_columns = []
    for col in required_columns:
        if col in df.columns:
            print(f"   [OK] {col}")
        else:
            print(f"   [MISSING] {col}")
            missing_columns.append(col)
    
    if missing_columns:
        print(f"\n[ERROR] Missing required columns: {missing_columns}")
        return False
    
    # Check data quality
    print("\n[CHECK] Data quality...")
    
    # Check for empty values in critical fields
    critical_fields = ['mushroom_id', 'scientific_name', 'edible', 'poisonous']
    issues = []
    
    for field in critical_fields:
        empty_count = df[field].isna().sum()
        if empty_count > 0:
            issues.append(f"{field}: {empty_count} empty values")
            print(f"   [WARN] {field}: {empty_count} empty values")
        else:
            print(f"   [OK] {field}: All values present")
    
    # Check edible/poisonous consistency
    print("\n[CHECK] Edible/poisonous classification...")
    edible_count = df['edible'].sum() if df['edible'].dtype == bool else (df['edible'] == True).sum()
    poisonous_count = df['poisonous'].sum() if df['poisonous'].dtype == bool else (df['poisonous'] == True).sum()
    
    print(f"   Edible species: {edible_count}")
    print(f"   Poisonous species: {poisonous_count}")
    print(f"   Total species: {len(df)}")
    
    # Check for species that are both edible and poisonous (shouldn't happen)
    both = df[(df['edible'] == True) & (df['poisonous'] == True)]
    if len(both) > 0:
        print(f"   [WARN] {len(both)} species marked as both edible AND poisonous:")
        for idx, row in both.iterrows():
            print(f"      - {row['scientific_name']} ({row['mushroom_id']})")
    
    # Check for species that are neither edible nor poisonous
    neither = df[(df['edible'] == False) & (df['poisonous'] == False)]
    if len(neither) > 0:
        print(f"   [WARN] {len(neither)} species marked as neither edible nor poisonous:")
        for idx, row in neither.iterrows():
            print(f"      - {row['scientific_name']} ({row['mushroom_id']})")
    
    # Check unique mushroom IDs
    print("\n[CHECK] Unique identifiers...")
    duplicate_ids = df[df.duplicated(subset=['mushroom_id'], keep=False)]
    if len(duplicate_ids) > 0:
        print(f"   [ERROR] Duplicate mushroom_id found:")
        for idx, row in duplicate_ids.iterrows():
            print(f"      - {row['mushroom_id']}: {row['scientific_name']}")
        issues.append("Duplicate mushroom IDs")
    else:
        print(f"   [OK] All mushroom IDs are unique")
    
    # Check scientific names
    duplicate_scientific = df[df.duplicated(subset=['scientific_name'], keep=False)]
    if len(duplicate_scientific) > 0:
        print(f"   [WARN] Duplicate scientific names found:")
        for idx, row in duplicate_scientific.iterrows():
            print(f"      - {row['scientific_name']} ({row['mushroom_id']})")
    
    # Summary
    print("\n" + "=" * 60)
    print("Dataset Summary")
    print("=" * 60)
    print(f"Total species: {len(df)}")
    print(f"Edible: {edible_count}")
    print(f"Poisonous: {poisonous_count}")
    print(f"Regions: {df['location_region'].nunique()} unique regions")
    print(f"Habitats: {df['habitat'].nunique()} unique habitats")
    
    # Show sample data
    print("\nSample entries:")
    for idx, row in df.head(3).iterrows():
        print(f"\n   {row['mushroom_id']}: {row['english_name']}")
        print(f"   Scientific: {row['scientific_name']}")
        print(f"   Local: {row['local_name']}")
        print(f"   Edible: {row['edible']}, Poisonous: {row['poisonous']}")
        print(f"   Location: {row['location_region']}, {row['location_province']}")
    
    # Final validation
    print("\n" + "=" * 60)
    if issues:
        print("[FAILED] VALIDATION FAILED")
        print("Issues found:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print("[PASSED] VALIDATION PASSED")
        print("Dataset is properly formatted and ready to use!")
        return True
    print("=" * 60)

if __name__ == "__main__":
    success = validate_dataset()
    exit(0 if success else 1)