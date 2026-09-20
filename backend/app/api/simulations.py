from fastapi import APIRouter, HTTPException, status
from app.schemas.scenario import ScenarioCreate
from app.schemas.simulation import SimulationResult
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.post("/run", response_model=SimulationResult, status_code=status.HTTP_200_OK)
def run_simulation(scenario: ScenarioCreate):
    """
    Run crop, water, economic, and risk simulation for a given scenario.
    Identical simulation logic used by saved scenarios.
    """
    try:
        service = SimulationService()
        result = service.run_simulation(scenario)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )
