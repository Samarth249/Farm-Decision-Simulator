import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

def generate_uuid() -> str:
    return f"sc_{uuid.uuid4().hex[:8]}"

def now_utc():
    return datetime.now(timezone.utc)

class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    crop: Mapped[str] = mapped_column(String, nullable=False)
    farm_area_ha: Mapped[float] = mapped_column(Float, nullable=False)
    planting_date: Mapped[str] = mapped_column(String, nullable=False)
    
    location_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    water_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    inputs_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    economics_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    parent_scenario_id: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc)

    results: Mapped[list["SimulationResultModel"]] = relationship(
        "SimulationResultModel", back_populates="scenario", cascade="all, delete-orphan"
    )

class SimulationResultModel(Base):
    __tablename__ = "simulation_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"res_{uuid.uuid4().hex[:8]}")
    scenario_id: Mapped[str] = mapped_column(String, ForeignKey("scenarios.id"), nullable=False)
    result_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)

    scenario: Mapped["ScenarioModel"] = relationship("ScenarioModel", back_populates="results")
