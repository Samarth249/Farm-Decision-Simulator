import json
import os
from typing import Dict, Any
from app.simulation.engine import SimulationEngine
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import ScientificOutputs, YieldOutput, WaterOutput

# Irrigation efficiency factors by application method
IRRIGATION_EFFICIENCY = {
    "drip": 0.90,
    "sprinkler": 0.75,
    "flood": 0.60,
    "rainfed": 1.00
}

class FallbackEngine(SimulationEngine):
    """Deterministic agronomic FallbackEngine implementing FAO-33 water-yield response curves with strict bounds."""
    
    def __init__(self, crop_data_path: str = None):
        if crop_data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            crop_data_path = os.path.join(base_dir, "data", "crops.json")
            
        self.crop_data: Dict[str, Any] = {}
        if os.path.exists(crop_data_path):
            with open(crop_data_path, "r", encoding="utf-8") as f:
                self.crop_data = json.load(f)

    def _get_crop_params(self, crop_key: str) -> Dict[str, Any]:
        crop_key_lower = crop_key.lower().strip()
        if crop_key_lower in self.crop_data:
            return self.crop_data[crop_key_lower]
        supported = ", ".join(list(self.crop_data.keys()))
        raise ValueError(f"Unsupported crop '{crop_key}'. Supported crops are: {supported}")

    def simulate(self, scenario: ScenarioCreate) -> ScientificOutputs:
        crop_params = self._get_crop_params(scenario.crop)
        y_m = max(0.0, float(crop_params["potential_yield_t_ha"]))
        et_m = max(0.001, float(crop_params["et_m_mm"]))  # Prevent div zero
        ky = max(0.0, float(crop_params["ky"]))

        # 1. Effective irrigation & total water available (bounded >= 0)
        efficiency = IRRIGATION_EFFICIENCY.get(scenario.water.method, 0.90)
        irrigation_input = max(0.0, scenario.water.irrigation)
        available_rain = max(0.0, scenario.water.available)

        effective_irrigation = irrigation_input * efficiency
        total_water_available = available_rain + effective_irrigation

        # 2. Actual evapotranspiration consumed ETa (Bounded: 0 <= ETa <= ETm)
        et_a = max(0.0, min(total_water_available, et_m))

        # 3. Water stress deficit ratio Sw (Bounded: 0 <= Sw <= 1)
        raw_deficit_ratio = 1.0 - (et_a / et_m)
        water_stress_index = max(0.0, min(1.0, raw_deficit_ratio))

        # 4. FAO-33 Yield Response Equation: 1 - Ya/Ym = Ky * (1 - ETa/ETm)
        # Bounded: 0 <= Ya <= Ym
        yield_reduction_fraction = max(0.0, ky * water_stress_index)
        relative_yield_fraction = max(0.0, 1.0 - yield_reduction_fraction)
        
        estimated_t_ha = y_m * relative_yield_fraction
        estimated_t_ha = max(0.0, min(y_m, round(estimated_t_ha, 2)))

        total_tonnes = round(estimated_t_ha * scenario.farm_area_ha, 2)

        yield_output = YieldOutput(
            estimated_t_ha=estimated_t_ha,
            total_tonnes=total_tonnes,
            potential_t_ha=y_m,
            unit="t/ha"
        )

        water_output = WaterOutput(
            consumed_mm=round(et_a, 1),
            crop_water_req_mm=round(et_m, 1),
            irrigation_applied_mm=round(effective_irrigation, 1),
            water_stress_index=round(water_stress_index, 3),
            unit="mm"
        )

        return ScientificOutputs(
            yield_output=yield_output,
            water_output=water_output,
            engine_used="fallback"
        )
