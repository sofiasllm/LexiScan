import os
import base64
import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import explicit models to avoid circular dependencies or import errors
from models import AnalysisResponse, ClauseAnalysis
from analyzer import ContractAnalyzer

# Charger les variables d'environnement
load_dotenv()

app = FastAPI(title="LexiScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENAI_API_KEY")
analyzer = ContractAnalyzer(api_key=API_KEY) if API_KEY else None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "LexiScan Backend Ready"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(file: UploadFile = File(...)):
    """
    Endpoint principal : Reçoit un PDF, l'analyse via IA, surligne les risques, 
    et renvoie le résultat + PDF modifié.
    """
    if not analyzer:
         # Fallback gracieux si pas de clé API, pour ne pas casser le front
         return AnalysisResponse(
             status="Erreur",
             message="Configuration serveur incomplète (API Key manquante).",
             clauses=[],
             pdf_base64=None
         )

    # 1. Lire le fichier en mémoire
    try:
        file_bytes = await file.read()
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        print(f"PDF Error: {e}")
        return AnalysisResponse(
            status="Erreur",
            message="Le fichier envoyé n'est pas un PDF valide.",
            clauses=[],
            pdf_base64=None
        )

    # 2. Extraire le texte (Tout le texte, pas de filtre)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    
    # Sécurité document vide
    if len(full_text.strip()) < 10:
        doc_bytes = doc.tobytes()
        pdf_b64 = base64.b64encode(doc_bytes).decode('utf-8')
        doc.close()
        return AnalysisResponse(
            status="Avertissement",
            message="Ce document semble vide ou scanné (image). L'IA ne peut pas lire le texte.",
            clauses=[],
            pdf_base64=pdf_b64
        )

    # 3. Analyse AI (On analyse TOUT, pas de filtre "Hors Sujet")
    # L'analyzer a déjà été mis à jour pour être permissif, on l'appelle directement.
    try:
        analysis_json = analyzer.analyze_full_text(full_text)
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        # En cas d'erreur IA, on renvoie quand même le PDF original
        doc_bytes = doc.tobytes()
        pdf_b64 = base64.b64encode(doc_bytes).decode('utf-8')
        doc.close()
        return AnalysisResponse(
            status="Erreur",
            message="L'IA n'a pas pu traiter ce document (Erreur OpenAI).",
            clauses=[],
            pdf_base64=pdf_b64
        )

    # 4. Traitement & Surlignage (PyMuPDF)
    clauses_data = analysis_json.get("clauses", [])
    clauses_objs = []
    
    for c_dict in clauses_data:
        # Conversion dict -> Model
        try:
            clause_obj = ClauseAnalysis(**c_dict)
            clauses_objs.append(clause_obj)
            
            # Application Surlignage
            citation = clause_obj.citation_exacte.strip()
            if citation and len(citation) > 3:
                # Couleur Rouge pour tout (1, 0, 0)
                color = (1, 0, 0)
                
                # On parcourt toutes les pages
                for page in doc:
                    # Recherche exacte
                    insts = page.search_for(citation)
                    
                    # Fallback snippet (40 chars) si citation longue non trouvée
                    if not insts and len(citation) > 60:
                        insts = page.search_for(citation[:40])
                    
                    if insts:
                        for inst in insts:
                            annot = page.add_highlight_annot(inst)
                            annot.set_colors(stroke=color)
                            annot.update()
        except Exception as e:
            print(f"Skipping clause due to error: {e}")
            continue

    # 5. Encodage Final (PDF Modifié)
    try:
        doc_bytes = doc.tobytes()
        pdf_base64 = base64.b64encode(doc_bytes).decode('utf-8')
        doc.close()
    except Exception as e:
        print(f"PDF Encoding Error: {e}")
        doc.close()
        return AnalysisResponse(
            status="Erreur", 
            message="Erreur lors de la génération du PDF modifié.",
            clauses=[],
            pdf_base64=None
        )

    # 6. Réponse Finale
    return AnalysisResponse(
        status=analysis_json.get("status", "Safe"),
        message=analysis_json.get("message", "Analyse terminée."),
        clauses=clauses_objs,
        pdf_base64=pdf_base64
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
