import os
import json
import base64
from openai import OpenAI
from typing import Dict, List, Optional

SYSTEM_PROMPT_ANALYSIS = """
Tu es LexiScan, une IA experte en audit de documents.
TA MISSION : Analyser le document fourni (Texte ou Image) pour détecter les risques, les clauses abusives ou les points d'attention.

TON : Pédagogue, Rassurant, Clair.
FORMAT DE SORTIE : JSON uniquement.

{
  "status": "Safe" | "Avertissement" | "Critique",
  "message": "Synthèse courte.",
  "clauses": [
    {
      "citation_exacte": "Texte exact (si lisible) ou description de la zone",
      "niveau_risque": "Faible" | "Moyen" | "Critique",
      "type": "Juridiction" | "Financier" | "Autre",
      "explication": "Pourquoi c'est un risque.",
      "conseil": "Quoi faire."
    }
  ]
}
"""

class ContractAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def analyze_mixed_content(self, text_content: Optional[str] = None, image_base64: Optional[str] = None) -> Dict:
        """
        Analyse hybride : Texte OU Image (Vision)
        """
        messages = [{"role": "system", "content": SYSTEM_PROMPT_ANALYSIS}]
        
        user_content = []
        user_content.append({"type": "text", "text": "Analyse ce document avec une rigueur extrême. Extrais les risques au format JSON."})

        if text_content:
            # Mode Texte (PDF/Docx)
            truncated = text_content[:50000]
            user_content.append({"type": "text", "text": f"CONTENU DU DOCUMENT :\n{truncated}"})
        
        if image_base64:
            # Mode Vision (Image/Scan)
            user_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_base64}",
                    "detail": "high"
                }
            })

        messages.append({"role": "user", "content": user_content})

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=messages,
                temperature=0.0
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"AI Error: {e}")
            return {"status": "Erreur", "message": "Echec analyse IA", "clauses": []}

    def chat_with_document(self, context: str, history: List[Dict], question: str) -> str:
        # (Similaire à avant, on garde la logique chat)
        messages = [{"role": "system", "content": "Tu es LexiScan. Réponds aux questions sur le document."}]
        messages.append({"role": "system", "content": f"CONTEXTE:\n{context[:30000]}"})
        messages.extend(history[-6:])
        messages.append({"role": "user", "content": question})
        
        try:
            res = self.client.chat.completions.create(model="gpt-4o", messages=messages)
            return res.choices[0].message.content
        except:
            return "Désolé, je ne peux pas répondre."
