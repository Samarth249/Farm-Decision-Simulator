from fastapi import APIRouter, HTTPException, status
from app.schemas.comparison import ComparisonRequest, ComparisonResult
from app.simulation.comparison import ComparisonEngine

router = APIRouter(prefix="/compare", tags=["Comparisons"])

@router.post("", response_model=ComparisonResult, status_code=status.HTTP_200_OK)
def compare_scenarios(request: ComparisonRequest):
    """
    Compare a baseline scenario against one or more alternative farming scenarios.
    Returns metric deltas, factor attributions, key differences, and human explanations.
    """
    try:
        engine = ComparisonEngine()
        result = engine.compare(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(e)}"
        )
