import os
import json
from openai import OpenAI
from typing import Dict, List
from models import AnalysisResponse, ClauseAnalysis

SYSTEM_PROMPT = """
Tu es LexiScan, un analyste juridique de précision.
TA MISSION : Analyser TOUT document soumis (contrats, lettres, règles, sujets d'examen, etc.) pour y détecter les flous, les incohérences ou les risques.

RÈGLES ABSOLUES :
1.  **Analyse Systématique** : Ne refuse JAMAIS d'analyser. Même si c'est une liste de courses, cherche s'il manque des précisions (ex: quantités, prix). Si c'est un sujet d'examen, vérifie la clarté des consignes.
2.  **Citation Exacte** : Pour chaque point soulevé, tu DOIS fournir le TEXTE EXACT (copié-collé) qui pose problème dans le champ `citation_exacte`. C'est CRUCIAL pour le surlignage.
3.  **Constructivité** : Si tout semble "Safe", dis-le, mais cherche quand même si une petite amélioration est possible (ex: "Bien rédigé, mais pourrait préciser le délai").

FORMAT JSON (Strict) :
{
  "status": "Safe" | "Avertissement" | "Critique",
  "message": "Résumé global de l'analyse en 2 phrases.",
  "clauses": [
    {
      "citation_exacte": "Le texte exact trouvé dans le document",
      "niveau_risque": "Faible" | "Moyen" | "Critique",
      "explication": "Pourquoi ce point est soulevé.",
      "conseil": "Suggestion d'amélioration."
    }
  ]
}
"""

class ContractAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def analyze_full_text(self, text: str) -> Dict:
        try:
            # On prend large pour avoir du contexte
            truncated_text = text[:20000]
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"ANALYSE CE DOCUMENT :\n\n{truncated_text}"}
                ],
                temperature=0.0
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return {
                "status": "Erreur",
                "message": "Analyse impossible suite à une erreur technique.",
                "clauses": []
            }
