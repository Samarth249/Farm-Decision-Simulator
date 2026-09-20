from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.scenario import ScenarioModel, SimulationResultModel
from app.schemas.scenario import ScenarioCreate

async def create_scenario(db: AsyncSession, scenario_in: ScenarioCreate) -> ScenarioModel:
    db_obj = ScenarioModel(
        name=scenario_in.name,
        crop=scenario_in.crop,
        farm_area_ha=scenario_in.farm_area_ha,
        planting_date=scenario_in.planting_date,
        location_json=scenario_in.location.model_dump(),
        water_json=scenario_in.water.model_dump(),
        inputs_json=scenario_in.inputs.model_dump(),
        economics_json=scenario_in.economics.model_dump(),
        parent_scenario_id=scenario_in.parent_scenario_id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_scenario_by_id(db: AsyncSession, scenario_id: str) -> Optional[ScenarioModel]:
    result = await db.execute(select(ScenarioModel).where(ScenarioModel.id == scenario_id))
    return result.scalars().first()

async def list_scenarios(db: AsyncSession, limit: int = 50) -> List[ScenarioModel]:
    result = await db.execute(select(ScenarioModel).order_by(ScenarioModel.created_at.desc()).limit(limit))
    return list(result.scalars().all())

async def save_simulation_result(db: AsyncSession, scenario_id: str, result_dict: dict) -> SimulationResultModel:
    db_obj = SimulationResultModel(
        scenario_id=scenario_id,
        result_json=result_dict
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_scenario(db: AsyncSession, scenario_id: str, scenario_in: ScenarioCreate) -> Optional[ScenarioModel]:
    scenario = await get_scenario_by_id(db, scenario_id)
    if not scenario:
        return None
    scenario.name = scenario_in.name
    scenario.crop = scenario_in.crop
    scenario.farm_area_ha = scenario_in.farm_area_ha
    scenario.planting_date = scenario_in.planting_date
    scenario.location_json = scenario_in.location.model_dump()
    scenario.water_json = scenario_in.water.model_dump()
    scenario.inputs_json = scenario_in.inputs.model_dump()
    scenario.economics_json = scenario_in.economics.model_dump()
    await db.commit()
    await db.refresh(scenario)
    return scenario

async def delete_scenario(db: AsyncSession, scenario_id: str) -> bool:
    scenario = await get_scenario_by_id(db, scenario_id)
    if not scenario:
        return False
    await db.delete(scenario)
    await db.commit()
    return True
