import os
import base64
import fitz  # PyMuPDF
import docx
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from models import AnalysisResponse, ClauseAnalysis
from analyzer import ContractAnalyzer

load_dotenv()
app = FastAPI(title="LexiScan API v3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENAI_API_KEY")
analyzer = ContractAnalyzer(api_key=API_KEY) if API_KEY else None

# Mock DB
active_sessions = {}
users_db = {} 

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    password_confirm: str
    first_name: str
    last_name: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: List[dict] = []

# --- Helpers ---
def process_upload(file_bytes: bytes, filename: str):
    """
    Retourne (texte, image_b64, type)
    """
    ext = filename.split('.')[-1].lower()
    
    # 1. Images
    if ext in ['jpg', 'jpeg', 'png', 'webp', 'heic']:
        b64 = base64.b64encode(file_bytes).decode('utf-8')
        return None, b64, 'image'
    
    # 2. PDF
    if ext == 'pdf':
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "".join([p.get_text() for p in doc])
            doc_bytes = doc.tobytes()
            b64 = base64.b64encode(doc_bytes).decode('utf-8')
            return text, b64, 'pdf'
        except: return None, None, 'error'

    # 3. Word
    if ext in ['docx', 'doc']:
        try:
            temp = f"temp_{filename}"
            with open(temp, "wb") as f: f.write(file_bytes)
            doc = docx.Document(temp)
            text = "\n".join([p.text for p in doc.paragraphs])
            os.remove(temp)
            return text, None, 'docx'
        except: return None, None, 'error'
        
    # 4. Text
    return file_bytes.decode('utf-8', errors='ignore'), None, 'txt'

# --- Auth Endpoints ---
@app.post("/auth/register")
def register(creds: RegisterRequest):
    if creds.password != creds.password_confirm:
        raise HTTPException(400, "Mots de passe différents")
    if creds.email in users_db:
        raise HTTPException(400, "Email déjà pris")
    
    users_db[creds.email] = creds.dict()
    return {"status": "created"}

@app.post("/auth/login")
def login(creds: LoginRequest):
    user = users_db.get(creds.email)
    if user and user['password'] == creds.password:
        return {"token": "valid", "user": user}
    # Dev backdoor
    if creds.email == "admin@lexiscan.io":
        return {"token": "admin", "user": {"first_name": "Admin", "email": creds.email}}
    raise HTTPException(401, "Identifiants invalides")

# --- Analysis Endpoint ---
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...), session_id: str = Form("default")):
    content = await file.read()
    text, img_b64, ftype = process_upload(content, file.filename)
    
    if ftype == 'error':
        return AnalysisResponse(status="Erreur", message="Format non supporté", clauses=[])

    if not analyzer:
        return AnalysisResponse(status="Erreur", message="Clé API OpenAI manquante ou invalide.", clauses=[])

    # Save context for chat (Text if avail, else marker for image)
    active_sessions[session_id] = text if text else "[Image Content]"

    # Call AI
    if ftype == 'image':
        res = analyzer.analyze_mixed_content(image_base64=img_b64)
        return AnalysisResponse(
            status=res.get("status", "Safe"),
            message=res.get("message", "Analyse Image"),
            clauses=[ClauseAnalysis(**c) for c in res.get("clauses", [])],
            pdf_base64=img_b64 # Send back image to display
        )
    else:
        res = analyzer.analyze_mixed_content(text_content=text)
        return AnalysisResponse(
            status=res.get("status", "Safe"),
            message=res.get("message", "Analyse Texte"),
            clauses=[ClauseAnalysis(**c) for c in res.get("clauses", [])],
            pdf_base64=img_b64 # PDF b64 or None
        )

@app.post("/chat")
async def chat(req: ChatRequest):
    context = active_sessions.get(req.session_id, "")
    reply = analyzer.chat_with_document(context, req.history, req.message)
    return {"response": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
