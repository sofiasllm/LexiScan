from pydantic import BaseModel
from typing import List, Optional

class ClauseAnalysis(BaseModel):
    citation_exacte: str
    niveau_risque: str
    type: Optional[str] = "Général"
    explication: str
    conseil: str
    page: Optional[int] = None

class AnalysisResponse(BaseModel):
    status: str
    message: str
    clauses: List[ClauseAnalysis]
    pdf_base64: Optional[str] = None
