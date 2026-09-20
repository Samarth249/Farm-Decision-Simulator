from abc import ABC, abstractmethod
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import ScientificOutputs

class SimulationEngine(ABC):
    """Abstract Base Class for crop simulation engines."""
    
    @abstractmethod
    def simulate(self, scenario: ScenarioCreate) -> ScientificOutputs:
        """Run crop-water simulation for given scenario inputs."""
        pass
