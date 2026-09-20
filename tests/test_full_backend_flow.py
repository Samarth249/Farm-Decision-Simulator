import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app

def test_complete_agrisim_backend_workflow():
    """
    Full AgriSim Backend Integration Test:
    Executes the complete user flow:
    1. Create Baseline Scenario
    2. Simulate Baseline Scenario
    3. Duplicate Scenario with Water Modification
    4. Simulate Alternative Scenario
    5. Compare Baseline vs Alternative
    6. Verify Factor Attribution and Narrative Explanations
    """
    with TestClient(app) as client:
        # 1. Create Baseline Scenario A
        base_payload = {
            "name": "Sugarcane Baseline",
            "location": {"name": "Nanded", "lat": 19.13, "lon": 77.32},
            "crop": "sugarcane",
            "farm_area_ha": 1.011715,
            "planting_date": "2026-06-15",
            "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"},
            "inputs": {
                "seed_cost": 10000.0,
                "fertilizer_cost": 18000.0,
                "labor_cost": 12000.0,
                "machinery_cost": 6000.0,
                "other_cost": 8000.0
            },
            "economics": {"market_price": 3100.0}
        }

        res_create_a = client.post("/api/v1/scenarios", json=base_payload)
        assert res_create_a.status_code == 201
        scenario_a = res_create_a.json()
        sc_a_id = scenario_a["id"]
        assert sc_a_id.startswith("sc_")

        # 2. Simulate Baseline Scenario A
        res_sim_a = client.post(f"/api/v1/scenarios/{sc_a_id}/simulate")
        assert res_sim_a.status_code == 200
        sim_a = res_sim_a.json()
        assert sim_a["yield_data"]["estimated_t_ha"] > 0

        # 3. Duplicate Scenario A as Scenario B with Low Water
        dup_payload = {
            "new_name": "Sugarcane Reduced Water",
            "modifications": {
                "water": {"available": 350.0, "irrigation": 150.0, "method": "drip"}
            }
        }
        res_dup = client.post(f"/api/v1/scenarios/{sc_a_id}/duplicate", json=dup_payload)
        assert res_dup.status_code == 201
        scenario_b = res_dup.json()
        sc_b_id = scenario_b["id"]

        # 4. Simulate Alternative Scenario B
        res_sim_b = client.post(f"/api/v1/scenarios/{sc_b_id}/simulate")
        assert res_sim_b.status_code == 200
        sim_b = res_sim_b.json()

        # 5. Compare Scenario A vs Scenario B
        compare_payload = {
            "baseline_scenario": scenario_a,
            "alternative_scenarios": [scenario_b]
        }
        res_compare = client.post("/api/v1/compare", json=compare_payload)
        assert res_compare.status_code == 200
        comparison = res_compare.json()

        # Verification assertions
        assert "Sugarcane Reduced Water" in comparison["deltas"]
        deltas = comparison["deltas"]["Sugarcane Reduced Water"]
        
        # Delta check: yield dropped
        yield_delta = next(d for d in deltas if d["metric"] == "yield")
        assert yield_delta["abs_diff"] < 0
        assert yield_delta["favorable"] is False

        # Attribution check: water availability/irrigation identified
        assert len(comparison["dominant_factors"]) > 0
        top_factor = comparison["dominant_factors"][0]
        assert "Water" in top_factor["factor"] or "Irrigation" in top_factor["factor"]

        # Explanation check: narrative explanation generated
        assert len(comparison["explanation"]) > 20
        print("\n--- Full Integration Test Output ---")
        print("Comparison Explanation:\n", comparison["explanation"])
        print("\nKey Differences:\n", "\n".join(comparison["key_differences"]))

def test_metadata_endpoints():
    with TestClient(app) as client:
        res_crops = client.get("/api/v1/crops")
        assert res_crops.status_code == 200
        crops = res_crops.json()
        assert "sugarcane" in crops

        res_weather = client.get("/api/v1/weather")
        assert res_weather.status_code == 200
        weather = res_weather.json()
        assert len(weather["locations"]) > 0
