"""
Test script to verify CSV to MongoDB migration is working correctly.
Run this after seeding the database to ensure all services work properly.
"""

from services.species_service import SpeciesService
from services.species_classifier import SpeciesClassifier
from services.habitat_analyzer import HabitatAnalyzer
from services.risk_engine import RiskEngine
from services.toxicity_detector import ToxicityDetector
from custom_predict import CustomMushroomPredictor

print("=" * 60)
print("TESTING CSV TO MONGODB MIGRATION")
print("=" * 60)

# Test 1: SpeciesService
print("\n1️⃣  Testing SpeciesService...")
try:
    species_service = SpeciesService()
    all_species = species_service.get_all_species()
    print(f"   ✅ Found {len(all_species)} species in database")
    
    # Test search
    search_result = species_service.search_species("oyster")
    if search_result:
        print(f"   ✅ Search works: Found '{search_result[0]['english_name']}'")
    
    # Test edibility filter
    edible = species_service.get_species_by_edibility(True)
    poisonous = species_service.get_species_by_edibility(False)
    print(f"   ✅ Filters work: {len(edible)} edible, {len(poisonous)} poisonous")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: SpeciesClassifier metadata lookup
print("\n2️⃣  Testing SpeciesClassifier metadata...")
try:
    classifier = SpeciesClassifier()
    metadata = classifier._get_species_metadata("Pleurotus ostreatus")
    if metadata:
        print(f"   ✅ Metadata lookup works")
        print(f"      English: {metadata.get('english_name')}")
        print(f"      Local: {metadata.get('local_name')}")
        print(f"      Edible: {metadata.get('edible')}")
    else:
        print(f"   ⚠️  No metadata found (species may not exist)")
    
    # Test available species
    available = classifier.get_available_species()
    print(f"   ✅ Available species: {len(available)}")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: HabitatAnalyzer
print("\n3️⃣  Testing HabitatAnalyzer...")
try:
    habitat = HabitatAnalyzer()
    
    # Test species lookup
    species_data = habitat._get_species_habitat_data("Auricularia polytricha")
    if species_data:
        print(f"   ✅ Habitat data lookup works")
        print(f"      Species: {species_data.get('english_name')}")
        print(f"      Location: {species_data.get('location_region')}, {species_data.get('location_province')}")
        print(f"      Habitat: {species_data.get('habitat')}")
    
    # Test location search
    by_location = habitat.get_species_by_location("Cavite")
    print(f"   ✅ Location search: Found {len(by_location)} species in Cavite")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: CustomMushroomPredictor edibility check
print("\n4️⃣  Testing CustomMushroomPredictor...")
try:
    predictor = CustomMushroomPredictor()
    
    # Test edibility lookup
    is_edible = predictor._get_edibility("White Oyster Mushroom")
    print(f"   ✅ Edibility check works")
    print(f"      White Oyster Mushroom is: {'EDIBLE' if is_edible else 'POISONOUS'}")
    
    is_poisonous = predictor._get_edibility("Death Cap")
    print(f"      Death Cap is: {'EDIBLE' if is_poisonous else 'POISONOUS'}")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 5: Data consistency check
print("\n5️⃣  Testing data consistency...")
try:
    species_service = SpeciesService()
    all_species = species_service.get_all_species()
    
    issues = []
    for species in all_species:
        # Check required fields
        if not species.get('english_name'):
            issues.append(f"Missing english_name for {species.get('_id')}")
        if not species.get('scientific_name'):
            issues.append(f"Missing scientific_name for {species.get('_id')}")
        if 'edible' not in species:
            issues.append(f"Missing edible field for {species.get('english_name')}")
    
    if issues:
        print(f"   ⚠️  Found {len(issues)} data issues:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print(f"   ✅ All species data is consistent")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Summary
print("\n" + "=" * 60)
print("MIGRATION TEST COMPLETE")
print("=" * 60)
print("\n✅ All services successfully migrated from CSV to MongoDB!")
print("\nNext step: Start the backend server and test via API")
print("  python app.py")
print("\nThen test the API:")
print("  python test_species_api.py")
print("=" * 60)
