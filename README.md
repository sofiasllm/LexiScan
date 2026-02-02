# L'Avocat de Poche - Web App

Application SaaS d'analyse de contrats juridiques par IA.

## Pré-requis
- Python 3.9+
- Node.js 18+
- Clé API OpenAI (`OPENAI_API_KEY`)

## Installation & Démarrage

### 1. Backend (FastAPI)
Ouvrez un terminal :
```bash
cd backend
# Installez les dépendances
pip install -r requirements.txt
# Lancez le serveur (port 8000)
# Windows Powershell
$env:OPENAI_API_KEY="sk-..."
uvicorn main:app --reload
```

### 2. Frontend (Next.js)
Ouvrez un **deuxième** terminal :
```bash
cd frontend
# Installez les dépendances (si ce n'est pas déjà fait)
npm install
# Lancez le serveur de développement (port 3000)
npm run dev
```

## Utilisation
1. Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).
2. Glissez un fichier **PDF** (texte sélectionnable) ou un fichier **Texte** dans la zone de drop.
3. L'IA analyse les clauses et affiche le résultat :
   - **Rouge** : Clause abusive/illégale.
   - **Orange** : Ambiguïté.
   - **Vert** : Clause valide.
4. Cliquez sur les zones colorées pour voir l'explication juridique.
