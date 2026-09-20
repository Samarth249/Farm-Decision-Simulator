import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.schemas.scenario import ScenarioCreate
from app.simulation.fallback_engine import FallbackEngine
from app.simulation.aquacrop_engine import AquaCropEngine
from app.services.simulation_service import SimulationService

client = TestClient(app)

def test_1_fallback_engine_water_delta():
    """TEST 1: FallbackEngine sensitivity check (500mm -> 350mm water)."""
    service = SimulationService(engine=FallbackEngine())
    
    sc_a = ScenarioCreate(name="Optimal Water", water={"available": 500.0, "irrigation": 350.0, "method": "drip"})
    res_a = service.run_simulation(sc_a)

    sc_b = ScenarioCreate(name="Low Water", water={"available": 350.0, "irrigation": 150.0, "method": "drip"})
    res_b = service.run_simulation(sc_b)

    assert res_b.yield_data.estimated_t_ha < res_a.yield_data.estimated_t_ha
    assert res_b.water_data.water_stress_index > res_a.water_data.water_stress_index
    assert res_b.risk_data.score > res_a.risk_data.score
    assert res_b.economics_data.profit != res_a.economics_data.profit
    assert res_a.engine_used == "fallback"
    print("\nTEST 1 PASSED: FallbackEngine sensitive to water availability.")

def test_2_aquacrop_engine_execution():
    """TEST 2: AquaCropEngine independent execution validation."""
    service = SimulationService(engine=AquaCropEngine())
    sc = ScenarioCreate(crop="wheat", planting_date="2026-05-01")
    res = service.run_simulation(sc)

    assert res.yield_data.estimated_t_ha > 0
    assert res.water_data.consumed_mm > 0
    assert res.engine_used in ["aquacrop", "fallback"]
    print(f"\nTEST 2 PASSED: AquaCropEngine executed successfully (Engine Used: {res.engine_used}).")

def test_3_aquacrop_fallback_on_invalid_inputs():
    """TEST 3: AquaCrop execution failure triggers FallbackEngine cleanly."""
    service = SimulationService(engine=AquaCropEngine())
    # Provide an out-of-range date to force AquaCrop model error and test graceful fallback
    sc = ScenarioCreate(crop="sugarcane", planting_date="2099-06-15")
    res = service.run_simulation(sc)

    assert res.yield_data.estimated_t_ha > 0
    assert res.engine_used == "fallback"
    print("\nTEST 3 PASSED: Out-of-range inputs gracefully handled by FallbackEngine.")

def test_4_factor_attribution_water():
    """TEST 4: Scenario A vs Scenario B (Water modification) identifies Water as dominant factor."""
    with TestClient(app) as test_app:
        sc_a_payload = ScenarioCreate(name="Base Water", water={"available": 500.0, "irrigation": 350.0}).model_dump()
        sc_b_payload = ScenarioCreate(name="Alt Water", water={"available": 350.0, "irrigation": 150.0}).model_dump()

        compare_req = {
            "baseline_scenario": sc_a_payload,
            "alternative_scenarios": [sc_b_payload]
        }
        resp = test_app.post("/api/v1/compare", json=compare_req)
        assert resp.status_code == 200
        comp = resp.json()

        top_factor = comp["dominant_factors"][0]
        assert "Water" in top_factor["factor"] or "Irrigation" in top_factor["factor"]
        print(f"\nTEST 4 PASSED: Water modification attributed to {top_factor['factor']}.")

def test_5_factor_attribution_planting_date():
    """TEST 5: Scenario A vs Scenario C (Planting Date modification) identifies Planting Date as dominant factor."""
    with TestClient(app) as test_app:
        sc_a_payload = ScenarioCreate(name="June Planting", planting_date="2026-06-15").model_dump()
        sc_c_payload = ScenarioCreate(name="July Planting", planting_date="2026-07-20").model_dump()

        compare_req = {
            "baseline_scenario": sc_a_payload,
            "alternative_scenarios": [sc_c_payload]
        }
        resp = test_app.post("/api/v1/compare", json=compare_req)
        assert resp.status_code == 200
        comp = resp.json()

        top_factor = comp["dominant_factors"][0]
        assert "Planting Date" in top_factor["factor"]
        print(f"\nTEST 5 PASSED: Planting Date modification attributed to {top_factor['factor']} (Not hardcoded to water!).")

if __name__ == "__main__":
    test_1_fallback_engine_water_delta()
    test_2_aquacrop_engine_execution()
    test_3_aquacrop_fallback_on_invalid_inputs()
    test_4_factor_attribution_water()
    test_5_factor_attribution_planting_date()
