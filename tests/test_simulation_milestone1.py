import sys
import os
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app

client = TestClient(app)

def test_milestone1_farmer_workflow_scenario_comparison():
    """
    Milestone 1 Verification Test:
    Proves the actual farmer workflow:
    Changing water availability between Scenario A (High Water) and Scenario B (Low Water)
    produces expected changes in yield, water stress, economics, and risk scores.
    """
    
    # 1. Baseline Scenario A (Sugarcane 2.5 acres ~ 1.0117 ha, 500mm rain + 350mm irrigation)
    scenario_a_payload = {
        "name": "Sugarcane Baseline (Optimal Water)",
        "location": {"name": "Nanded", "lat": 19.13, "lon": 77.32},
        "crop": "sugarcane",
        "farm_area_ha": 1.011715,
        "planting_date": "2026-06-15",
        "water": {
            "available": 500.0,
            "irrigation": 350.0,
            "method": "drip"
        },
        "inputs": {
            "seed_cost": 10000.0,
            "fertilizer_cost": 18000.0,
            "labor_cost": 12000.0,
            "machinery_cost": 6000.0,
            "other_cost": 8000.0
        },
        "economics": {
            "market_price": 3100.0
        }
    }

    response_a = client.post("/api/v1/simulations/run", json=scenario_a_payload)
    assert response_a.status_code == 200, f"Scenario A failed: {response_a.text}"
    result_a = response_a.json()

    # 2. Alternative Scenario B (Reduced water: 350mm rain + 150mm irrigation)
    scenario_b_payload = dict(scenario_a_payload)
    scenario_b_payload["name"] = "Sugarcane Low Water"
    scenario_b_payload["water"] = {
        "available": 350.0,
        "irrigation": 150.0,
        "method": "drip"
    }

    response_b = client.post("/api/v1/simulations/run", json=scenario_b_payload)
    assert response_b.status_code == 200, f"Scenario B failed: {response_b.text}"
    result_b = response_b.json()

    # 3. Assertions proving dynamic scenario simulation behavior
    print("\n--- Milestone 1 Verification Output ---")
    print(f"Scenario A Yield: {result_a['yield_data']['estimated_t_ha']} t/ha | Profit: INR {result_a['economics_data']['profit']} | Risk: {result_a['risk_data']['score']} ({result_a['risk_data']['level']})")
    print(f"Scenario B Yield: {result_b['yield_data']['estimated_t_ha']} t/ha | Profit: INR {result_b['economics_data']['profit']} | Risk: {result_b['risk_data']['score']} ({result_b['risk_data']['level']})")

    # Yield decreases due to lower total water
    assert result_b["yield_data"]["estimated_t_ha"] < result_a["yield_data"]["estimated_t_ha"], "Scenario B yield should be lower than Scenario A yield"
    
    # Water stress index increases
    assert result_b["water_data"]["water_stress_index"] > result_a["water_data"]["water_stress_index"], "Scenario B water stress should be higher than Scenario A"

    # Risk score increases
    assert result_b["risk_data"]["score"] > result_a["risk_data"]["score"], "Scenario B risk score should be higher than Scenario A"

    # Irrigation cost decreases due to lower applied irrigation
    assert result_b["economics_data"]["irrigation_cost"] < result_a["economics_data"]["irrigation_cost"], "Scenario B irrigation cost should be lower than Scenario A"

    # Revenue decreases due to lower total yield production
    assert result_b["economics_data"]["revenue"] < result_a["economics_data"]["revenue"], "Scenario B revenue should be lower than Scenario A"

    print("Milestone 1 PASSED: Farmer scenario simulation workflow verified successfully!")

if __name__ == "__main__":
    test_milestone1_farmer_workflow_scenario_comparison()
