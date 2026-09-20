from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class YieldOutput(BaseModel):
    estimated_t_ha: float = Field(..., description="Estimated crop yield per hectare (t/ha)")
    total_tonnes: float = Field(..., description="Total crop yield production across farm area (tonnes)")
    potential_t_ha: float = Field(..., description="Maximum potential crop yield under ideal water (t/ha)")
    unit: str = Field(default="t/ha", description="Yield unit")

class WaterOutput(BaseModel):
    consumed_mm: float = Field(..., description="Actual evapotranspiration / water consumed by crop (mm)")
    crop_water_req_mm: float = Field(..., description="Potential crop evapotranspiration requirement ETm (mm)")
    irrigation_applied_mm: float = Field(..., description="Effective irrigation applied (mm)")
    water_stress_index: float = Field(..., description="Water stress deficit ratio (0 = no stress, 1 = extreme deficit)")
    unit: str = Field(default="mm", description="Water depth unit")

class EconomicsOutput(BaseModel):
    input_cost: float = Field(..., description="Seeds, fertilizer, machinery, other inputs (₹)")
    irrigation_cost: float = Field(..., description="Irrigation operating cost (₹)")
    labor_cost: float = Field(..., description="Labor cost (₹)")
    total_cost: float = Field(..., description="Total farm production cost (₹)")
    revenue: float = Field(..., description="Total gross revenue (₹)")
    profit: float = Field(..., description="Net farm profit (₹)")
    roi_percentage: float = Field(..., description="Return on investment percentage (%)")

class RiskOutput(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Model-derived composite risk score (0-100)")
    level: Literal["Low", "Medium", "High"] = Field(..., description="Categorized risk level")
    factors: List[str] = Field(default_factory=list, description="Primary risk contributing factors")

class ScientificOutputs(BaseModel):
    yield_output: YieldOutput
    water_output: WaterOutput
    engine_used: Literal["aquacrop", "fallback"] = Field(default="fallback")

class FactorContribution(BaseModel):
    factor: str = Field(..., description="Name of the scenario variable")
    impact: float = Field(..., description="Magnitude of metric change")
    metric: str = Field(..., description="Target metric (e.g. yield, profit, risk)")
    direction: Literal["positive", "negative", "neutral"] = Field(..., description="Direction of impact")
    contribution_pct: float = Field(..., description="Model-based estimated contribution percentage")

class SimulationResult(BaseModel):
    scenario_id: Optional[str] = Field(default=None, description="Scenario ID if saved")
    crop: str
    farm_area_ha: float
    yield_data: YieldOutput
    water_data: WaterOutput
    economics_data: EconomicsOutput
    risk_data: RiskOutput
    engine_used: str
    explanation: Optional[str] = Field(default=None, description="Human readable summary explanation")
