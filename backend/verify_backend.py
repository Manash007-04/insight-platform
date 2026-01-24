
import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"  # Assuming default port, adjust if needed

def test_create_and_update_concept():
    print("--- Starting Backend Verification ---")
    
    # 1. Create a Concept with Level 5
    print("\n1. Creating Concept with Level 5...")
    payload = {
        "name": "Test Concept Level 5",
        "description": "Verifying persistence",
        "subject_area": "Test Logic",
        "difficulty_level": 0.5,
        "level": 5
    }
    
    try:
        res = requests.post(f"{BASE_URL}/concepts", json=payload)
        if res.status_code != 201:
            print(f"FAILED to update: {res.status_code} {res.text}")
            return
            
        data = res.json()
        concept_id = data.get('concept_id') or data.get('id') # Adjust based on actual response
        print(f"Concept Created. ID: {concept_id}")
        
    except Exception as e:
        print(f"API Connection Failed: {e}")
        return

    # 2. Fetch Back and Verify
    print("\n2. Fetching Concept to Verify Level...")
    res = requests.get(f"{BASE_URL}/concepts/{concept_id}")
    fetched = res.json()
    print(f"Fetched Data: {json.dumps(fetched, indent=2)}")
    
    if fetched.get('level') == 5:
        print("✅ SUCCESS: Level 5 persisted correctly on Create.")
    else:
        print(f"❌ FAILURE: Expected Level 5, got {fetched.get('level')}")

    # 3. Update to Level 8
    print("\n3. Updating Concept to Level 8...")
    update_payload = {"level": 8}
    res = requests.put(f"{BASE_URL}/concepts/{concept_id}", json=update_payload)
    print(f"Update Response: {res.status_code}")
    
    # 4. Fetch Back Again
    print("\n4. Fetching Concept to Verify Update...")
    res = requests.get(f"{BASE_URL}/concepts/{concept_id}")
    fetched = res.json()
    print(f"Fetched Data: {json.dumps(fetched, indent=2)}")
    
    if fetched.get('level') == 8:
        print("✅ SUCCESS: Level 8 persisted correctly on Update.")
    else:
        print(f"❌ FAILURE: Expected Level 8, got {fetched.get('level')}")

    # Cleanup
    print("\n5. Cleaning up...")
    requests.delete(f"{BASE_URL}/concepts/{concept_id}")
    print("Done.")

if __name__ == "__main__":
    test_create_and_update_concept()
