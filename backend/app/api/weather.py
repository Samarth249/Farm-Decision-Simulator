import json
import os
from fastapi import APIRouter, HTTPException, status

router = APIRouter(tags=["Metadata & Weather"])

@router.get("/crops", status_code=status.HTTP_200_OK)
def get_supported_crops():
    """Retrieve supported crop types and baseline agronomic parameters."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    crops_path = os.path.join(base_dir, "data", "crops.json")
    if os.path.exists(crops_path):
        with open(crops_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@router.get("/weather", status_code=status.HTTP_200_OK)
def get_weather_locations():
    """Retrieve available weather regions and climate datasets."""
    return {
        "locations": [
            {
                "id": "nanded",
                "name": "Nanded, Maharashtra",
                "lat": 19.13,
                "lon": 77.32,
                "annual_rainfall_mm": 850.0,
                "dataset": "historical_baseline"
            },
            {
                "id": "pune",
                "name": "Pune, Maharashtra",
                "lat": 18.52,
                "lon": 73.85,
                "annual_rainfall_mm": 720.0,
                "dataset": "historical_baseline"
            },
            {
                "id": "latur",
                "name": "Latur, Maharashtra",
                "lat": 18.40,
                "lon": 76.56,
                "annual_rainfall_mm": 700.0,
                "dataset": "historical_baseline"
            }
        ]
    }
