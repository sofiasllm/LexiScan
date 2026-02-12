# LexiScan - AI Legal Assistant

Application professionnelle d'analyse de contrats juridiques par Intelligence Artificielle.
Détecte les risques, surligne les clauses problématiques et génère un rapport d'audit instantané.

## 🌟 Fonctionnalités
- **Analyse IA Avancée (GPT-4o)** : Détection précise des clauses abusives, floues ou manquantes.
- **Surlignage Intelligent** : Les risques sont directement surlignés dans le PDF.
- **Navigation Interactive** : Cliquez sur une alerte pour voir la clause dans le document (Page exacte).
- **Score de Sécurité** : Évaluation globale du risque contractuel.
- **Interface Premium** : Dashboard moderne, mode sombre, animations fluides.

## 🛠️ Installation

### Pré-requis
- Python 3.9+
- Clé API OpenAI (`OPENAI_API_KEY`)

### 1. Backend (API Python)
Le cerveau de l'application.
```bash
cd backend
# Installation des dépendances
pip install -r requirements.txt

# Création du fichier .env (si absent)
# Ajoutez: OPENAI_API_KEY=sk-votre-cle-ici
```

Lancer le serveur :
```bash
uvicorn main:app --reload
```
*Le backend sera accessible sur `http://localhost:8000`.*

### 2. Frontend (Interface Web)
L'interface utilisateur. C'est une application web statique moderne.

**Option A (Simple)** :
Ouvrez simplement le fichier `frontend/index.html` dans votre navigateur (Chrome/Edge/Firefox).

**Option B (Serveur Web - Recommandé)** :
Si vous avez Python installé :
```bash
cd frontend
python -m http.server 3000
```
Puis ouvrez `http://localhost:3000`.

## 🚀 Utilisation
1. Ouvrez l'interface.
2. Glissez-déposez un contrat **PDF**.
3. Attendez quelques secondes que l'IA scanne le document.
4. Consultez le **Score de Risque** et la liste des alertes.
5. Cliquez sur une alerte pour sauter à la page concernée.
6. Téléchargez le rapport annoté si besoin.

## 🎨 Architecture
- **Backend** : FastAPI, PyMuPDF (Fitz), OpenAI GPT-4o.
- **Frontend** : Vanilla JS, TailwindCSS (CDN), Glassmorphism UI.
