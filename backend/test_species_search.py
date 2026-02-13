"""
Quick test to verify species search API works correctly
"""

from services.species_service import SpeciesService

def test_species_search():
    """Test species search with different queries"""
    service = SpeciesService()
    
    test_queries = [
        "Button",
        "Button Mushroom",
        "Oyster",
        "White Oyster",
        "Death Cap",
        "Enoki"
    ]
    
    print("=" * 60)
    print("TESTING SPECIES SEARCH")
    print("=" * 60)
    
    for query in test_queries:
        print(f"\n🔍 Searching for: '{query}'")
        results = service.search_species(query)
        
        if results:
            print(f"   ✅ Found {len(results)} result(s):")
            for r in results:
                print(f"      • {r['english_name']} ({r['scientific_name']})")
                print(f"        Edible: {r['edible']}, Location: {r.get('location', 'N/A')}")
        else:
            print(f"   ❌ No results found")
    
    print("\n" + "=" * 60)
    print("ALL SPECIES IN DATABASE:")
    print("=" * 60)
    all_species = service.get_all_species()
    print(f"\nTotal species: {len(all_species)}")
    for s in all_species:
        edible_status = "🟢 EDIBLE" if s['edible'] else "🔴 POISONOUS"
        print(f"  {edible_status} - {s['english_name']}")

if __name__ == "__main__":
    test_species_search()
