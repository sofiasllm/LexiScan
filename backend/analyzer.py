import os
import json
import re
from openai import OpenAI
from typing import List, Dict
from models import Clause, AnalysisResult

SYSTEM_PROMPT = """
Tu es LexiScan, un assistant juridique spécialisé dans l'analyse de contrats et la protection des consommateurs/entrepreneurs. 
Ton ton est professionnel, direct et pédagogique.

MISSION :
Auditer la clause fournie pour détecter les pièges, les déséquilibres et les zones de flou.

POINTS DE VIGILANCE PRIORITAIRES :
1. Clauses de Résiliation (Préavis trop long, frais, difficultés de sortie).
2. Engagements Financiers (Frais cachés, hausse tarifaire, intérêts abusifs).
3. Responsabilité (Décharge totale de l'autre partie).
4. Renouvellement Automatique (Tacite reconduction sans notif).
5. Données Personnelles (Vague ou abusif).

RÈGLES D'ANALYSE :
- Si un risque est détecté, sois explicite.
- Propose une phrase de négociation concrète si nécessaire.

FORMAT DE SORTIE (JSON STRICT) :
{
  "risk_level": "ROUGE" | "ORANGE" | "VERT",
  "score": 0.0 à 1.0, 
  "legal_reference": "Article de loi ou Principe juridique (ex: Code de la Consommation)",
  "explanation": "Explication claire du risque (ex: 'Cette clause vous empêche de...')",
  "recommendation": "Conseil de négociation ou phrase à copier-coller (ex: 'Demander: ...')"
}
"""

class ContractAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def _call_llm(self, clause_text: str) -> Dict:
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"CLAUSE:\n{clause_text}"}
                ],
                temperature=0.1
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return {
                "risk_level": "ORANGE",
                "score": 0.5,
                "legal_reference": "Erreur API",
                "explanation": "Analyse échouée temporairement.",
                "recommendation": "Réessayer."
            }

    def analyze_text(self, text: str) -> List[Clause]:
        # Segmentation basique (améliorable avec NLP)
        raw_segments = [s.strip() for s in re.split(r'\n\s*\n', text) if s.strip()]
        
        clauses = []
        current_index = 0
        
        for idx, segment in enumerate(raw_segments):
            # Retrouver l'index dans le texte original
            # Note: Cette méthode simple peut échouer si segments identiques. 
            # Pour un MVP, on assume l'ordre séquentiel.
            start = text.find(segment, current_index)
            if start == -1:
                start = current_index # Fallback
            
            end = start + len(segment)
            current_index = end
            
            # Analyse LLM
            # TODO: Pour la prod, faire des appels asynchrones/batching
            analysis_json = self._call_llm(segment)
            
            analysis_result = AnalysisResult(**analysis_json)
            
            clauses.append(Clause(
                id=idx,
                text=segment,
                start_index=start,
                end_index=end,
                analysis=analysis_result
            ))
            
        return clauses
