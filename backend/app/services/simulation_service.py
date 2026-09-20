from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import SimulationResult
from app.simulation.engine import SimulationEngine
from app.simulation.fallback_engine import FallbackEngine
from app.simulation.aquacrop_engine import AquaCropEngine
from app.simulation.cost import CostEngine
from app.simulation.risk import RiskEngine

class SimulationService:
    """Unified service orchestrating scientific simulation, economics calculation, and risk scoring."""

    def __init__(self, engine: SimulationEngine = None):
        self.engine = engine or AquaCropEngine(fallback=FallbackEngine())
        self.cost_engine = CostEngine()
        self.risk_engine = RiskEngine()

    def run_simulation(self, scenario: ScenarioCreate) -> SimulationResult:
        # 1. Scientific simulation (crop yield + water consumption)
        scientific = self.engine.simulate(scenario)
        
        # 2. Financial & economics calculation
        economics = self.cost_engine.calculate(scenario, scientific)
        
        # 3. Model-derived composite risk calculation
        risk = self.risk_engine.calculate(scenario, scientific, economics)
        
        return SimulationResult(
            scenario_id=None,
            crop=scenario.crop,
            farm_area_ha=scenario.farm_area_ha,
            yield_data=scientific.yield_output,
            water_data=scientific.water_output,
            economics_data=economics,
            risk_data=risk,
            engine_used=scientific.engine_used,
            explanation=None
        )
