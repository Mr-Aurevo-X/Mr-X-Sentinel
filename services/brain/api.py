"""
MrXBrain API — Serveur FastAPI exposant le réseau neuronal.

Endpoints :
  GET  /status          — état du modèle
  POST /analyze         — analyse d'un message (4 prédictions)
  POST /label           — ajouter un exemple d'entraînement
  POST /retrain         — réentraîner le modèle
  GET  /stats           — statistiques
"""
import os
import sqlite3
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from ml.model import MrXBrainInference

DB_PATH    = "brain.db"
API_KEY    = os.getenv("BRAIN_API_KEY", "changeme")

# Instance unique du modèle (chargée au démarrage)
brain      = MrXBrainInference()
retrain_lock = threading.Lock()


# ── Schémas Pydantic ────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)

class LabelRequest(BaseModel):
    text:    str   = Field(..., min_length=1, max_length=2000)
    spam:    int   = Field(..., ge=0, le=1)
    toxique: int   = Field(..., ge=0, le=1)
    xp:      float = Field(..., ge=0.0, le=1.0)
    eco:     int   = Field(..., ge=0, le=2)

class RetrainRequest(BaseModel):
    epochs: int = Field(50, ge=5, le=200)
    lr:     float = Field(0.001, ge=1e-5, le=0.1)


# ── Auth ────────────────────────────────────────────────────────────────────

def verify_key(x_api_key: Annotated[str | None, Header()] = None):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Clé API invalide")


# ── Cycle de vie ────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    _setup_db()
    yield

def _setup_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS training_data (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                text     TEXT    NOT NULL,
                spam     INTEGER NOT NULL,
                toxique  INTEGER NOT NULL,
                xp       REAL    NOT NULL,
                eco      INTEGER NOT NULL,
                added_at TEXT    DEFAULT CURRENT_TIMESTAMP
            )
        """)


# ── Application ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="MrXBrain API",
    description="Réseau neuronal multi-tâches pour les bots Mr-X",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/", response_class=HTMLResponse)
def dashboard():
    """Dashboard graphique."""
    html = Path(__file__).parent / "dashboard.html"
    return HTMLResponse(html.read_text(encoding="utf-8"))


@app.get("/status")
def status():
    """État du modèle."""
    with sqlite3.connect(DB_PATH) as conn:
        count = conn.execute("SELECT COUNT(*) FROM training_data").fetchone()[0]
    return {
        "loaded":         brain.is_loaded(),
        "custom_examples": count,
        "device":         str(brain.device),
    }


@app.post("/analyze", dependencies=[Depends(verify_key)])
def analyze(req: AnalyzeRequest):
    """
    Analyse un message et retourne 4 prédictions :
    spam, toxicité, valeur XP, signal économique.
    """
    result = brain.analyze(req.text)
    return result.to_dict()


@app.post("/label", dependencies=[Depends(verify_key)])
def label(req: LabelRequest):
    """Ajouter un exemple d'entraînement personnalisé."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO training_data (text, spam, toxique, xp, eco) VALUES (?,?,?,?,?)",
            (req.text, req.spam, req.toxique, req.xp, req.eco),
        )
    with sqlite3.connect(DB_PATH) as conn:
        total = conn.execute("SELECT COUNT(*) FROM training_data").fetchone()[0]
    return {"ok": True, "total_custom": total}


@app.post("/retrain", dependencies=[Depends(verify_key)])
def retrain(req: RetrainRequest):
    """
    Réentraîner le modèle avec les données built-in + tous les exemples
    ajoutés via /label. Opération bloquante (lancée en thread séparé si déjà en cours).
    """
    if not retrain_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Un entraînement est déjà en cours.")

    try:
        from ml.train import train as do_train
        do_train(epochs=req.epochs, lr=req.lr, verbose=False)
        brain._load()
    finally:
        retrain_lock.release()

    return {"ok": True, "epochs": req.epochs}


@app.get("/stats", dependencies=[Depends(verify_key)])
def stats():
    """Statistiques des données d'entraînement custom."""
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT COUNT(*), SUM(spam), SUM(toxique), SUM(eco=1), SUM(eco=2) "
            "FROM training_data"
        ).fetchone()
    total, spams, toxics, farms, spends = (int(x or 0) for x in row)
    return {
        "total":   total,
        "spam":    spams,
        "toxique": toxics,
        "farming": farms,
        "depense": spends,
        "neutre":  total - farms - spends,
    }
