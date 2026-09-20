from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.models.scenario import ScenarioModel
from app.schemas.scenario import ScenarioCreate, ScenarioResponse, LocationSchema, WaterSchema, WeatherSchema, InputsSchema, EconomicsSchema

def map_model_to_schema(model: ScenarioModel) -> ScenarioResponse:
    return ScenarioResponse(
        id=model.id,
        name=model.name,
        crop=model.crop,
        farm_area_ha=model.farm_area_ha,
        planting_date=model.planting_date,
        location=LocationSchema(**model.location_json),
        water=WaterSchema(**model.water_json),
        weather=WeatherSchema(source="historical"),
        inputs=InputsSchema(**model.inputs_json),
        economics=EconomicsSchema(**model.economics_json),
        parent_scenario_id=model.parent_scenario_id,
        created_at=model.created_at.isoformat(),
        updated_at=model.updated_at.isoformat()
    )

class ScenarioService:
    @staticmethod
    async def create_scenario(db: AsyncSession, scenario_in: ScenarioCreate) -> ScenarioResponse:
        model = await crud.create_scenario(db, scenario_in)
        return map_model_to_schema(model)

    @staticmethod
    async def get_scenario(db: AsyncSession, scenario_id: str) -> Optional[ScenarioResponse]:
        model = await crud.get_scenario_by_id(db, scenario_id)
        if not model:
            return None
        return map_model_to_schema(model)

    @staticmethod
    async def list_scenarios(db: AsyncSession) -> List[ScenarioResponse]:
        models = await crud.list_scenarios(db)
        return [map_model_to_schema(m) for m in models]
