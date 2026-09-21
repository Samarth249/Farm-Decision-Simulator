import sys
import os
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from fastapi.testclient import TestClient
from app.main import app
from app.simulation.fallback_engine import FallbackEngine
from app.schemas.scenario import ScenarioCreate, WaterSchema, InputsSchema, EconomicsSchema

client = TestClient(app)

def test_unknown_crop_returns_400():
    """Adversarial Test 1: Unknown crop must return HTTP 400 Bad Request, never fall back to Sugarcane silently."""
    payload = {
        "crop": "dragonfruit",
        "farm_area_acres": 2.5,
        "water": {"available": 500.0, "irrigation": 300.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 400
    assert "Unsupported crop" in response.json()["detail"]

def test_frontend_crops_match_backend():
    """Adversarial Test 2: All selectable frontend crops exist in backend crops.json."""
    frontend_crops = ["sugarcane", "cotton", "maize", "wheat", "soybean"]
    engine = FallbackEngine()
    for crop in frontend_crops:
        params = engine._get_crop_params(crop)
        assert params["potential_yield_t_ha"] > 0
        assert params["et_m_mm"] > 0

def test_crop_specific_potential_yield_targets():
    """Verify that potential yield targets differ between crops (Sugarcane != Wheat != Soybean)."""
    engine = FallbackEngine()
    sugarcane_params = engine._get_crop_params("sugarcane")
    wheat_params = engine._get_crop_params("wheat")
    soybean_params = engine._get_crop_params("soybean")

    assert sugarcane_params["potential_yield_t_ha"] == 90.0
    assert wheat_params["potential_yield_t_ha"] == 5.5
    assert soybean_params["potential_yield_t_ha"] == 3.5

    assert sugarcane_params["potential_yield_t_ha"] != wheat_params["potential_yield_t_ha"]
    assert wheat_params["potential_yield_t_ha"] != soybean_params["potential_yield_t_ha"]

def test_rainfed_cannot_receive_irrigation():
    """Adversarial Test 3: Rainfed method with irrigation > 0 must fail API validation (HTTP 422)."""
    payload = {
        "crop": "sugarcane",
        "farm_area_acres": 2.5,
        "water": {"available": 500.0, "irrigation": 200.0, "method": "rainfed"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 422
    assert "Irrigation depth must be 0 mm when irrigation method is set to 'rainfed'" in str(response.json())

def test_area_scaling_economics():
    """Adversarial Test 4: Area scaling at 1 ha, 2 ha, and 10 ha leaves t/ha, mm, cost/ha, and ROI invariant."""
    base_payload = {
        "crop": "sugarcane",
        "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"},
        "inputs": {"seed_cost": 10000.0, "fertilizer_cost": 18000.0, "labor_cost": 12000.0, "machinery_cost": 6000.0, "other_cost": 8000.0},
        "economics": {"market_price": 3100.0}
    }

    res_1ha = client.post("/api/v1/simulations/run", json={**base_payload, "farm_area_ha": 1.0}).json()
    res_2ha = client.post("/api/v1/simulations/run", json={**base_payload, "farm_area_ha": 2.0}).json()
    res_10ha = client.post("/api/v1/simulations/run", json={**base_payload, "farm_area_ha": 10.0}).json()

    # Yield per hectare & water consumption must remain invariant
    assert res_1ha["yield_data"]["estimated_t_ha"] == res_2ha["yield_data"]["estimated_t_ha"] == res_10ha["yield_data"]["estimated_t_ha"]
    assert res_1ha["water_data"]["consumed_mm"] == res_2ha["water_data"]["consumed_mm"] == res_10ha["water_data"]["consumed_mm"]

    # ROI (%) must remain invariant
    assert pytest.approx(res_1ha["economics_data"]["roi_percentage"], abs=0.1) == res_2ha["economics_data"]["roi_percentage"] == res_10ha["economics_data"]["roi_percentage"]

    # Total cost, revenue, and profit must scale linearly with area (approx 10x from 1ha to 10ha)
    assert pytest.approx(res_10ha["economics_data"]["total_cost"], rel=1e-2) == res_1ha["economics_data"]["total_cost"] * 10.0
    assert pytest.approx(res_10ha["economics_data"]["revenue"], rel=1e-2) == res_1ha["economics_data"]["revenue"] * 10.0
    assert pytest.approx(res_10ha["economics_data"]["profit"], rel=1e-2) == res_1ha["economics_data"]["profit"] * 10.0

def test_water_risk_double_counting_mitigated():
    """Adversarial Test 5: High irrigation mitigates low rainfall penalty without artificial double-counting."""
    low_rain_irrigated = {
        "crop": "sugarcane",
        "farm_area_acres": 2.5,
        "water": {"available": 200.0, "irrigation": 1100.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=low_rain_irrigated).json()
    assert response["risk_data"]["score"] < 40
    assert response["risk_data"]["level"] in ["Low", "Medium"]

def test_factor_attribution_no_fake_100_percent():
    """Adversarial Test 6: Comparing baseline against identical scenario yields zero fake 100% attribution."""
    payload_a = {"name": "A", "crop": "sugarcane", "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"}}
    payload_b = {"name": "B", "crop": "sugarcane", "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"}}

    response = client.post("/api/v1/compare", json={"baseline_scenario": payload_a, "alternative_scenarios": [payload_b]}).json()
    for factor in response["dominant_factors"]:
        if factor["impact"] == 0.0:
            assert factor["contribution_pct"] == 0.0

def test_truthful_engine_used():
    """Adversarial Test 7: Simulation engine label is truthful ("aquacrop" on success, "fallback" on failure)."""
    # Standard Wheat simulation should successfully execute AquaCrop-OSPy
    wheat_payload = {"crop": "wheat", "farm_area_acres": 2.5, "water": {"available": 300.0, "irrigation": 200.0, "method": "drip"}}
    response_wheat = client.post("/api/v1/simulations/run", json=wheat_payload).json()
    assert response_wheat["engine_used"] == "aquacrop"

    # Out-of-range date should log warning and delegate to FallbackEngine (FAO-33)
    out_of_range_payload = {"crop": "wheat", "planting_date": "2099-06-15", "water": {"available": 300.0, "irrigation": 200.0, "method": "drip"}}
    response_fallback = client.post("/api/v1/simulations/run", json=out_of_range_payload).json()
    assert response_fallback["engine_used"] == "fallback"
