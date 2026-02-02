import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
import io
from unidecode import unidecode
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

from analyzer import ContractAnalyzer
from models import DocumentAnalysis

app = FastAPI(title="L'Avocat de Poche API")

# Config CORS pour le frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation Analyzer
API_KEY = os.getenv("OPENAI_API_KEY")
analyzer = ContractAnalyzer(api_key=API_KEY) if API_KEY else None

@app.get("/")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/analyze", response_model=DocumentAnalysis)
async def analyze_document(file: UploadFile = File(...)):
    if not analyzer:
        raise HTTPException(status_code=500, detail="OpenAI API Key not configured on server. Please check .env file.")

    filename = file.filename
    content_type = file.content_type
    
    full_text = ""

    # Extraction sommaire (MVP)
    if content_type == "application/pdf":
        try:
            file_bytes = await file.read()
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        full_text += extracted + "\n\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parsing error: {e}")
    elif content_type.startswith("text/"):
        full_text = (await file.read()).decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or Text.")

    if not full_text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from document.")

    # Lancement Analyse
    clauses = analyzer.analyze_text(full_text)
    
    # Calcul Score Global (Moyenne pondérée simple pour l'instant)
    # Rouge = 100 pts de risque, Orange = 50, Vert = 0
    risk_score = 0
    if clauses:
        total_risk = sum([100 if c.analysis.risk_level == "ROUGE" else (50 if c.analysis.risk_level == "ORANGE" else 0) for c in clauses])
        risk_score = total_risk / len(clauses)

    import base64

    # Encode file content to Base64 for frontend display
    pdf_base64 = None
    if content_type == "application/pdf":
        try:
            # We already read the file above, but 'file.read()' moves the cursor.
            # Ideally we should capture the bytes once.
            # However, looking at the code above: 'file_bytes = await file.read()' inside the if block.
            # But wait, looking at lines 47-48:
            # if content_type == "application/pdf":
            #     file_bytes = await file.read()
            # So we can reuse 'file_bytes' if it exists.
            
            # Use the bytes we already read.
            if 'file_bytes' in locals():
                 pdf_base64 = base64.b64encode(file_bytes).decode('utf-8')
        except Exception:
            pass # Non-critical if visualization fails

    return DocumentAnalysis(
        filename=filename,
        total_clauses=len(clauses),
        risk_score_global=round(risk_score, 2),
        clauses=clauses,
        pdf_base64=pdf_base64
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
