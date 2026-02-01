import os
import json
import re
import sys 
from typing import List, Dict, Optional

# On tente d'importer la librairie OpenAI.
try:
    from openai import OpenAI
except ImportError:
    print("ERREUR: La librairie 'openai' n'est pas installée.")
    print("Veuillez l'installer avec : pip install -r requirements.txt")
    sys.exit(1)

# --- CONFIGURATION ---

# Récupération de la clé API depuis les variables d'environnement
API_KEY = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """
Tu es un Expert Juridique Senior spécialisé en Droit des Contrats français et européen (Code de la Consommation, Loi Alur, RGPD).

TA MISSION :
Analyser la clause contractuelle fournie par l'utilisateur pour détecter toute abusivité, illégalité ou risque.

RÈGLES D'ANALYSE :
1. Compare strictement la clause aux textes de loi en vigueur et à la jurisprudence.
2. Classe le risque selon : "VERT" (Valide), "ORANGE" (Ambigu/Risqué), "ROUGE" (Illégal/Abusif).
3. Si ROUGE ou ORANGE, cite précisément l'article de loi violé (ex: Art R212-1 Code de la Consommation) et explique pourquoi en une phrase simple.
4. Reste factuel et concis.

FORMAT DE SORTIE (JSON UNIQUEMENT) :
{
  "risk_level": "ROUGE" | "ORANGE" | "VERT",
  "score": 0.0 à 1.0, 
  "legal_reference": "Nom de la loi ou de l'article",
  "explanation": "Explication courte du problème",
  "recommendation": "Conseil pour corriger ou refuser la clause"
}
"""

def analyze_clause_with_llm(client: OpenAI, clause_text: str) -> Dict:
    """
    Envoie la clause à l'API OpenAI pour analyse.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # Ou gpt-3.5-turbo
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"CLAUSE À ANALYSER :\n{clause_text}"}
            ],
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        return {
            "risk_level": "ERREUR",
            "score": 0.0,
            "legal_reference": "N/A",
            "explanation": f"Erreur lors de l'appel API : {str(e)}",
            "recommendation": "Vérifiez votre connexion et votre clé API."
        }

class ContractAnalyzer:
    def __init__(self, document_text: str, client: OpenAI):
        self.raw_text = document_text
        self.client = client

    def segment_clauses(self) -> List[str]:
        """
        Découpe le contrat en clauses.
        """
        # Segmentation simple par double saut de ligne
        segments = [s.strip() for s in re.split(r'\n\s*\n', self.raw_text) if s.strip()]
        return segments

    def analyze(self):
        segments = self.segment_clauses()
        results = []
        
        print(f"Analyse de {len(segments)} clauses en cours avec OpenAI...")
        
        for segment in segments:
            # Recherche de la position
            start_index = self.raw_text.find(segment) # Simplifié
            end_index = start_index + len(segment)

            # Appel API
            analysis = analyze_clause_with_llm(self.client, segment)
            
            clause_result = {
                "text": segment[:50] + "..." if len(segment) > 50 else segment,
                "range": {"start": start_index, "end": end_index},
                "analysis": analysis
            }
            results.append(clause_result)
            
        return results

# --- DATA DE TEST ---

contrat_exemple = """
CONTRAT DE LOCATION

Article 1 : Paiement
Le loyer est de 800 euros. Le paiement devra être effectué par prélèvement automatique obligatoire chaque 1er du mois.

Article 2 : Animaux
La détention d'animaux domestiques est strictement interdite dans le logement sous peine de résiliation.

Article 3 : Jouissance des lieux
Le locataire usera paisiblement des lieux loués.
"""

# --- EXÉCUTION ---

if __name__ == "__main__":
    
    if not API_KEY or API_KEY.startswith("sk-...") or len(API_KEY) < 10:
        print("\nERREUR : Clé API manquante ou invalide.")
        print("Veuillez définir votre clé API OpenAI réelle :")
        print("  Windows (CMD)        : set OPENAI_API_KEY=sk-votre-vraie-cle-ici")
        print("  Windows (PowerShell) : $env:OPENAI_API_KEY='sk-votre-vraie-cle-ici'")
        sys.exit(1)

    print("\n--- DÉMARRAGE DE L'ANALYSE (LIVE) ---")
    client = OpenAI(api_key=API_KEY)
    
    engine = ContractAnalyzer(contrat_exemple, client)
    analysis_results = engine.analyze()

    print("\n--- RÉSULTATS ---")
    print(json.dumps(analysis_results, indent=2, ensure_ascii=False))
