import sys
import os

# Ensure backend directory is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.api.simulations import router as simulations_router
from app.api.scenarios import router as scenarios_router
from app.api.comparisons import router as comparisons_router
from app.api.weather import router as weather_router

# Include routers under /v1 and root prefixes to handle Vercel path rewriting transparently
app.include_router(simulations_router, prefix="/v1")
app.include_router(scenarios_router, prefix="/v1")
app.include_router(comparisons_router, prefix="/v1")
app.include_router(weather_router, prefix="/v1")

app.include_router(simulations_router, prefix="")
app.include_router(scenarios_router, prefix="")
app.include_router(comparisons_router, prefix="")
app.include_router(weather_router, prefix="")
