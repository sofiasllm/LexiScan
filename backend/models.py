from pydantic import BaseModel
from typing import List, Optional

class ClauseAnalysis(BaseModel):
    citation_exacte: str
    niveau_risque: str  # "Faible", "Moyen", "Critique"
    explication: str
    conseil: str

class AnalysisResponse(BaseModel):
    status: str
    message: str
    clauses: List[ClauseAnalysis]
    pdf_base64: Optional[str] = None
