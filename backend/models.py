from pydantic import BaseModel
from typing import List, Optional

class AnalysisResult(BaseModel):
    risk_level: str
    score: float
    legal_reference: str
    explanation: str
    recommendation: str

class Clause(BaseModel):
    id: int
    text: str
    start_index: int
    end_index: int
    analysis: Optional[AnalysisResult] = None

class DocumentAnalysis(BaseModel):
    filename: str
    total_clauses: int
    risk_score_global: float # 0 to 100 refined score
    clauses: List[Clause]
    pdf_base64: Optional[str] = None
