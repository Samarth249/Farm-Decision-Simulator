import os
import pandas as pd
from typing import Optional, Dict, Any

from app.simulation.engine import SimulationEngine
from app.simulation.fallback_engine import FallbackEngine
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import ScientificOutputs, YieldOutput, WaterOutput

# Map friendly crop names to AquaCrop standard crop names
AQUACROP_NAME_MAP = {
    "sugarcane": "Sugarcane",
    "wheat": "Wheat",
    "maize": "Maize",
    "cotton": "Cotton"
}

class AquaCropEngine(SimulationEngine):
    """
    Scientific AquaCrop-OSPy simulation engine.
    Runs physical crop-water-soil-weather daily timestep model.
    Seamlessly delegates to FallbackEngine (FAO-33) if inputs or model execution fail.
    """

    def __init__(self, fallback: Optional[SimulationEngine] = None):
        self.fallback = fallback or FallbackEngine()

    def simulate(self, scenario: ScenarioCreate) -> ScientificOutputs:
        try:
            from aquacrop import AquaCropModel, Crop, Soil, InitialWaterContent, IrrigationManagement
            from aquacrop.utils import prepare_weather, get_filepath

            crop_key = scenario.crop.lower().strip()
            aquacrop_crop_name = AQUACROP_NAME_MAP.get(crop_key, "Wheat")

            # 1. Prepare Weather Data
            weather_filepath = get_filepath("champion_climate.txt")
            wdf = prepare_weather(weather_filepath)

            # 2. Configure Crop and Soil
            # Convert planting date YYYY-MM-DD -> MM/DD for AquaCrop
            date_parts = scenario.planting_date.split("-")
            planting_mm_dd = f"{date_parts[1]}/{date_parts[2]}" if len(date_parts) == 3 else "05/01"

            crop = Crop(aquacrop_crop_name, planting_date=planting_mm_dd)
            soil = Soil("SandyLoam")
            init_wc = InitialWaterContent(value=["FC"])

            # 3. Configure Irrigation Management
            # Irrigation depth allocated (mm)
            irr_depth = max(0.0, scenario.water.irrigation)
            irrig_mngt = IrrigationManagement(irrigation_method=1, SMT=[70, 70, 70, 70], MaxIrr=irr_depth)

            # 4. Initialize & Run AquaCrop Model
            # Set simulation window covering full growing period
            sim_start = f"{date_parts[0]}/05/01" if len(date_parts) == 3 else "1982/05/01"
            sim_end = f"{date_parts[0]}/10/30" if len(date_parts) == 3 else "1982/10/30"

            model = AquaCropModel(
                sim_start_time=sim_start,
                sim_end_time=sim_end,
                weather_df=wdf,
                crop=crop,
                soil=soil,
                initial_water_content=init_wc,
                irrigation_management=irrig_mngt
            )
            model.run_model(till_termination=True)

            # 5. Extract Outputs
            crop_growth = model.get_crop_growth()
            water_flux = model.get_water_flux()

            if crop_growth.empty or water_flux.empty:
                return self.fallback.simulate(scenario)

            est_yield_t_ha = float(crop_growth["DryYield"].max())
            pot_yield_t_ha = float(crop_growth["YieldPot"].max())
            if pot_yield_t_ha <= 0:
                pot_yield_t_ha = max(est_yield_t_ha, 5.0)

            total_tonnes = round(est_yield_t_ha * scenario.farm_area_ha, 2)

            # Calculate actual ET consumed (Transpiration + Soil Evaporation)
            actual_tr = float(water_flux["Tr"].sum())
            actual_es = float(water_flux["Es"].sum())
            et_a = max(0.0, actual_tr + actual_es)

            pot_tr = float(water_flux["TrPot"].sum())
            pot_es = float(water_flux["EsPot"].sum())
            et_m = max(et_a, pot_tr + pot_es, 1.0)

            irr_applied = float(water_flux["IrrDay"].sum())

            water_stress_index = max(0.0, min(1.0, 1.0 - (et_a / et_m)))

            yield_output = YieldOutput(
                estimated_t_ha=round(est_yield_t_ha, 2),
                total_tonnes=total_tonnes,
                potential_t_ha=round(pot_yield_t_ha, 2),
                unit="t/ha"
            )

            water_output = WaterOutput(
                consumed_mm=round(et_a, 1),
                crop_water_req_mm=round(et_m, 1),
                irrigation_applied_mm=round(irr_applied, 1),
                water_stress_index=round(water_stress_index, 3),
                unit="mm"
            )

            return ScientificOutputs(
                yield_output=yield_output,
                water_output=water_output,
                engine_used="aquacrop"
            )

        except Exception as e:
            # Fallback guarantee when AquaCrop execution is unviable for given crop/inputs
            return self.fallback.simulate(scenario)
