import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app

client = TestClient(app)

def test_negative_farm_area_returns_422():
    """Negative farm area (ha or acres) must return HTTP 422 validation error."""
    payload = {
        "crop": "sugarcane",
        "farm_area_ha": -2.5,
        "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 422

def test_negative_rainfall_returns_422():
    """Negative rainfall (available water) must return HTTP 422 validation error."""
    payload = {
        "crop": "sugarcane",
        "water": {"available": -100.0, "irrigation": 350.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 422

def test_negative_irrigation_returns_422():
    """Negative irrigation volume must return HTTP 422 validation error."""
    payload = {
        "crop": "sugarcane",
        "water": {"available": 500.0, "irrigation": -50.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 422

def test_invalid_planting_date_returns_422():
    """Malformed planting date format must return HTTP 422 validation error."""
    payload = {
        "crop": "sugarcane",
        "planting_date": "15-06-2026",
        "water": {"available": 500.0, "irrigation": 350.0, "method": "drip"}
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 422

def test_scenario_update_and_crud_lifecycle():
    """Complete Scenario CRUD lifecycle: CREATE -> GET -> UPDATE -> GET updated -> DELETE -> GET 404."""
    # 1. CREATE
    create_payload = {
        "name": "Lifecycle Test Scenario",
        "crop": "wheat",
        "farm_area_ha": 2.0,
        "water": {"available": 400.0, "irrigation": 200.0, "method": "drip"}
    }
    create_res = client.post("/api/v1/scenarios", json=create_payload)
    assert create_res.status_code == 201
    sc_data = create_res.json()
    sc_id = sc_data["id"]

    # 2. GET
    get_res = client.get(f"/api/v1/scenarios/{sc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Lifecycle Test Scenario"

    # 3. UPDATE
    update_payload = {
        "name": "Updated Lifecycle Scenario",
        "water": {"available": 450.0, "irrigation": 250.0, "method": "drip"}
    }
    update_res = client.put(f"/api/v1/scenarios/{sc_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Lifecycle Scenario"
    assert update_res.json()["water"]["irrigation"] == 250.0

    # 4. GET updated
    get_updated = client.get(f"/api/v1/scenarios/{sc_id}")
    assert get_updated.status_code == 200
    assert get_updated.json()["name"] == "Updated Lifecycle Scenario"
    assert get_updated.json()["water"]["irrigation"] == 250.0

    # 5. DELETE
    del_res = client.delete(f"/api/v1/scenarios/{sc_id}")
    assert del_res.status_code == 200

    # 6. GET deleted -> 404
    get_deleted = client.get(f"/api/v1/scenarios/{sc_id}")
    assert get_deleted.status_code == 404
