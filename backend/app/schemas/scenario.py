from typing import Optional, Literal
from pydantic import BaseModel, Field, model_validator

ACRES_TO_HA = 0.404686

class LocationSchema(BaseModel):
    name: str = Field(default="Nanded", description="Name of the farm location")
    lat: float = Field(default=19.13, ge=-90.0, le=90.0, description="Latitude")
    lon: float = Field(default=77.32, ge=-180.0, le=180.0, description="Longitude")

class WaterSchema(BaseModel):
    available: float = Field(
        default=500.0, ge=0.0,
        description="Seasonal rainfall / precipitation received during scenario (rainfall_mm)"
    )
    irrigation: float = Field(
        default=350.0, ge=0.0,
        description="Planned irrigation water supplied (irrigation_mm)"
    )
    method: Literal["drip", "flood", "sprinkler", "rainfed"] = Field(
        default="drip",
        description="Irrigation application method (drip=90% eff, sprinkler=75% eff, flood=60% eff, rainfed=100% eff)"
    )

class WeatherSchema(BaseModel):
    source: Literal["historical", "forecast", "custom"] = Field(
        default="historical",
        description="Weather data source"
    )

class InputsSchema(BaseModel):
    seed_cost: float = Field(default=10000.0, ge=0.0, description="Seed/planting material cost (₹)")
    fertilizer_cost: float = Field(default=18000.0, ge=0.0, description="Fertilizer cost (₹)")
    labor_cost: float = Field(default=12000.0, ge=0.0, description="Labor cost (₹)")
    machinery_cost: float = Field(default=6000.0, ge=0.0, description="Machinery cost (₹)")
    other_cost: float = Field(default=8000.0, ge=0.0, description="Pesticides, electricity, and other miscellaneous costs (₹)")

class EconomicsSchema(BaseModel):
    market_price: float = Field(default=3100.0, gt=0.0, description="Expected market price per tonne (₹/tonne)")

class ScenarioCreate(BaseModel):
    name: str = Field(default="Baseline Scenario", description="Human readable title of scenario")
    location: LocationSchema = Field(default_factory=LocationSchema)
    crop: str = Field(default="sugarcane", description="Target crop key (e.g. sugarcane, wheat, maize, cotton)")
    farm_area_ha: float = Field(default=1.011715, gt=0.0, description="Farm area in hectares (canonical internal unit)")
    farm_area_acres: Optional[float] = Field(default=None, gt=0.0, description="Farm area in acres (optional API input; converts to hectares)")
    planting_date: str = Field(default="2026-06-15", pattern=r"^\d{4}-\d{2}-\d{2}$", description="Planting date in YYYY-MM-DD format")
    water: WaterSchema = Field(default_factory=WaterSchema)
    weather: WeatherSchema = Field(default_factory=WeatherSchema)
    inputs: InputsSchema = Field(default_factory=InputsSchema)
    economics: EconomicsSchema = Field(default_factory=EconomicsSchema)
    parent_scenario_id: Optional[str] = Field(default=None, description="Parent scenario ID if cloned/duplicated")

    @model_validator(mode="before")
    @classmethod
    def convert_acres_to_ha(cls, data):
        if isinstance(data, dict):
            acres = data.get("farm_area_acres")
            if acres is not None and acres > 0 and "farm_area_ha" not in data:
                data["farm_area_ha"] = acres * ACRES_TO_HA
        return data

    @model_validator(mode="after")
    def validate_rainfed_water(self):
        if self.water.method == "rainfed" and self.water.irrigation > 0:
            raise ValueError("Irrigation depth must be 0 mm when irrigation method is set to 'rainfed'.")
        return self

class ScenarioResponse(ScenarioCreate):
    id: str
    created_at: str
    updated_at: str

class ScenarioDuplicate(BaseModel):
    new_name: str = Field(..., description="Name for the duplicated scenario")
    modifications: Optional[dict] = Field(default=None, description="Optional field overrides for the cloned scenario")
