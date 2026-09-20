# AgriSim — Farm Scenario & Decision Simulator

**AgriSim** is a digital farming scenario simulator and decision-support application built for modern agricultural planning.

It empowers farmers, agronomists, and researchers to adjust operational decisions—such as crop selection, farm area, water availability, irrigation method, planting schedule, and input costs—and immediately observe the consequences on **crop yield, water consumption, total production cost, net profit, and risk**.

---

## Key Capabilities

1. **Configurable Farming Scenarios**: Input real-world quantities (farm area in hectares/acres, seasonal rainfall in mm, irrigation depth in mm, fertilizer/labor expenditure, market prices).
2. **Dual-Engine Simulation Architecture**:
   - **AquaCropEngine**: Physical crop-water simulation core powered by `AquaCrop-OSPy`.
   - **FallbackEngine**: Agronomic simulator implementing FAO-33 water-yield deficit response curves ($1 - \frac{Y_a}{Y_m} = K_y \left(1 - \frac{ET_a}{ET_m}\right)$) with strict variable bounds.
3. **Transparent Economic Model**: Computes seed, fertilizer, labor, machinery, irrigation pumping costs ($\text{irrigation mm} \times 20\,\text{INR/mm/ha} \times \text{ha}$), gross revenue, and net profit.
4. **Model-Derived Composite Risk Engine**: Calculates a 0–100 risk score based on water stress deficit (40%), rainfall deficit relative to crop ET requirement (30%), and cost exposure ratio (30%).
5. **Controlled Perturbation Factor Attribution**: Evaluates partial derivative impacts by perturbing individual scenario variables to determine exact model-based contribution percentages.
6. **Side-by-Side Scenario Comparison**: Multi-scenario matrix comparing yield, water use, costs, profit, and risk levels side-by-side.
7. **Deterministic Scientific Reasoning**: Rule-based explanation engine providing structured narrative takeaways and bullet-point summaries.

---

## System Architecture

```text
                                React + Vite Frontend
                                         │
                                         ▼
                               FastAPI REST Endpoints
                                         │
                                         ▼
                                SimulationService
                                         │
                                ┌────────┴────────┐
                                ▼                 ▼
                         AquaCropEngine    FallbackEngine (FAO-33)
                                │                 │
                                └────────┬────────┘
                                         ▼
                                 ScientificOutputs
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   ▼                     ▼                     ▼
              Cost Engine           Risk Engine        Factor Attribution
                   │                     │                     │
                   └─────────────────────┼─────────────────────┘
                                         ▼
                                 Comparison Engine
                                         │
                                         ▼
                              Deterministic Explainer
```

---

## Directory Structure

```text
farm-decision/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI REST routers (simulations, scenarios, comparisons, weather)
│   │   ├── core/         # Settings & configuration (config.py)
│   │   ├── db/           # SQLite database session & CRUD operations
│   │   ├── models/       # SQLAlchemy ORM models (ScenarioModel, SimulationResultModel)
│   │   ├── schemas/      # Pydantic v2 data validation models
│   │   ├── services/     # Service orchestration (SimulationService, ScenarioService)
│   │   ├── simulation/   # Simulation engines (FallbackEngine, AquaCropEngine, Cost, Risk, Factors)
│   │   ├── ai/           # Rule-based narrative explainer
│   │   └── main.py       # FastAPI application entrypoint
│   └── requirements.txt  # Python backend dependencies
├── src/
│   ├── components/       # UI widgets, cards, charts, and header/layout
│   ├── context/          # React ScenarioContext for global scenario state
│   ├── pages/            # Page screens (Dashboard, ScenarioBuilder, CompareScenarios, History, Weather)
│   └── services/         # API client layer (api.js) connecting to FastAPI endpoints
├── data/
│   └── crops.json        # FAO-33 reference crop parameters (Sugarcane, Wheat, Maize, Cotton)
├── tests/                # Comprehensive pytest suite (8 integration & validation tests)
├── package.json          # React + Vite frontend dependencies
└── README.md
```

---

## Getting Started

### 1. Start the FastAPI Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

The interactive FastAPI documentation will be available at: `http://localhost:8000/docs`

### 2. Start the React Frontend

```bash
# In project root
npm install

# Run Vite dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

Run the backend test suite verifying simulation sensitivity, AquaCrop fallback execution, factor attribution, and API workflow:

```bash
python -m pytest tests/ -s
```

All 8 tests execute and pass in under ~2.5 seconds.
