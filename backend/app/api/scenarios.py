from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.scenario import ScenarioCreate, ScenarioResponse, ScenarioDuplicate
from app.schemas.simulation import SimulationResult
from app.services.scenario_service import ScenarioService
from app.services.simulation_service import SimulationService
from app.db import crud

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(scenario: ScenarioCreate, db: AsyncSession = Depends(get_db)):
    """Create a new farming scenario."""
    return await ScenarioService.create_scenario(db, scenario)

@router.get("", response_model=List[ScenarioResponse], status_code=status.HTTP_200_OK)
async def list_scenarios(db: AsyncSession = Depends(get_db)):
    """List all created farming scenarios."""
    return await ScenarioService.list_scenarios(db)

@router.get("/{scenario_id}", response_model=ScenarioResponse, status_code=status.HTTP_200_OK)
async def get_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    """Get scenario by ID."""
    scenario = await ScenarioService.get_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return scenario

@router.put("/{scenario_id}", response_model=ScenarioResponse, status_code=status.HTTP_200_OK)
async def update_scenario(scenario_id: str, scenario_in: ScenarioCreate, db: AsyncSession = Depends(get_db)):
    """Update an existing scenario's inputs."""
    updated = await crud.update_scenario(db, scenario_id, scenario_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    from app.services.scenario_service import map_model_to_schema
    return map_model_to_schema(updated)

@router.delete("/{scenario_id}", status_code=status.HTTP_200_OK)
async def delete_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a scenario by ID."""
    deleted = await crud.delete_scenario(db, scenario_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return {"message": "Scenario deleted successfully", "id": scenario_id}

@router.post("/{scenario_id}/simulate", response_model=SimulationResult, status_code=status.HTTP_200_OK)
async def simulate_saved_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    """Run simulation on a saved scenario and persist result."""
    scenario = await ScenarioService.get_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    try:
        sim_service = SimulationService()
        result = sim_service.run_simulation(scenario)
        result.scenario_id = scenario_id

        # Save simulation result to DB
        await crud.save_simulation_result(db, scenario_id, result.model_dump())
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )

@router.post("/{scenario_id}/duplicate", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_scenario(scenario_id: str, dup_in: ScenarioDuplicate, db: AsyncSession = Depends(get_db)):
    """Duplicate an existing scenario with optional variable modifications."""
    parent = await ScenarioService.get_scenario(db, scenario_id)
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent scenario not found")

    parent_dict = parent.model_dump()
    parent_dict["name"] = dup_in.new_name
    parent_dict["parent_scenario_id"] = scenario_id

    if dup_in.modifications:
        for k, v in dup_in.modifications.items():
            if k in parent_dict and isinstance(v, dict):
                parent_dict[k].update(v)
            else:
                parent_dict[k] = v

    new_scenario_in = ScenarioCreate(**parent_dict)
    return await ScenarioService.create_scenario(db, new_scenario_in)
