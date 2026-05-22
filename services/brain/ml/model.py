"""
MrXBrain — Réseau neuronal multi-tâches.

Architecture :
  Entrée texte → Tokenisation → Embedding → BiLSTM partagé
                                                  │
                    ┌─────────────┬───────────────┼──────────────┐
                    │             │               │              │
               Spam Head    Toxicity Head     XP Head     Economy Head
               (binaire)    (binaire)       (régression)  (3 classes)
"""
import os
import pickle
import re
from typing import Optional

import torch
import torch.nn as nn

MAX_LEN    = 60
VOCAB_SIZE = 5000
EMBED_DIM  = 64
HIDDEN_DIM = 128
ECO_CLASSES = 3   # 0=neutre  1=farming  2=dépense

_HERE      = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_HERE, "mrxbrain.pt")
VOCAB_PATH = os.path.join(_HERE, "vocab.pkl")


# ── Tokenizer ──────────────────────────────────────────────────────────────

def tokenize(text: str) -> list[str]:
    t = text.lower()
    t = re.sub(r"https?://\S+",          " __URL__ ",          t)
    t = re.sub(r"discord\.gg/\S+",       " __INVITE__ ",       t)
    t = re.sub(r"@everyone|@here",       " __MENTION_ALL__ ",  t)
    t = re.sub(r"@\w+",                  " __MENTION__ ",      t)
    t = re.sub(r"[^\w\s]",              " ",                   t)
    return [tok for tok in t.split() if tok]


# ── Modèle ─────────────────────────────────────────────────────────────────

class MrXBrain(nn.Module):
    """Encodeur BiLSTM partagé + 4 têtes de sortie indépendantes."""

    def __init__(self,
                 vocab_size: int  = VOCAB_SIZE,
                 embed_dim:  int  = EMBED_DIM,
                 hidden_dim: int  = HIDDEN_DIM):
        super().__init__()

        # Encodeur partagé
        self.embedding = nn.Embedding(vocab_size + 2, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3,
        )
        self.dropout = nn.Dropout(0.4)
        feat = hidden_dim * 2

        # Têtes de sortie
        self.spam_head = nn.Sequential(
            nn.Linear(feat, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, 1), nn.Sigmoid(),
        )
        self.tox_head = nn.Sequential(
            nn.Linear(feat, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, 1), nn.Sigmoid(),
        )
        self.xp_head = nn.Sequential(
            nn.Linear(feat, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, 1), nn.Sigmoid(),
        )
        self.eco_head = nn.Sequential(
            nn.Linear(feat, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, ECO_CLASSES),
        )

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        emb = self.dropout(self.embedding(x))
        _, (hidden, _) = self.lstm(emb)
        return torch.cat([hidden[-2], hidden[-1]], dim=1)

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        f = self.encode(x)
        return {
            "spam": self.spam_head(f),
            "tox":  self.tox_head(f),
            "xp":   self.xp_head(f),
            "eco":  self.eco_head(f),
        }


# ── Résultat d'analyse ─────────────────────────────────────────────────────

class BrainResult:
    __slots__ = ("spam", "toxicity", "xp_score", "eco_label", "eco_probs")

    ECO_NAMES  = ["neutre", "farming", "dépense"]
    ECO_EMOJIS = ["⚪", "🌾", "💸"]

    def __init__(self, spam: float, toxicity: float,
                 xp_score: float, eco_label: int, eco_probs: list[float]):
        self.spam      = spam
        self.toxicity  = toxicity
        self.xp_score  = xp_score
        self.eco_label = eco_label
        self.eco_probs = eco_probs

    @property
    def eco_name(self) -> str:
        return self.ECO_NAMES[self.eco_label]

    def to_dict(self) -> dict:
        return {
            "spam":      round(self.spam, 4),
            "toxicity":  round(self.toxicity, 4),
            "xp_score":  round(self.xp_score, 4),
            "eco_label": self.eco_label,
            "eco_name":  self.eco_name,
            "eco_probs": [round(p, 4) for p in self.eco_probs],
        }

    def __repr__(self) -> str:
        return (f"BrainResult(spam={self.spam:.2f}, tox={self.toxicity:.2f}, "
                f"xp={self.xp_score:.2f}, eco={self.eco_name})")


# ── Interface d'inférence ──────────────────────────────────────────────────

class MrXBrainInference:
    """Charge le modèle et expose une API de prédiction simple."""

    def __init__(self):
        self.vocab:  dict[str, int]    = {}
        self.model:  Optional[MrXBrain] = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load()

    def _load(self) -> None:
        if not (os.path.exists(MODEL_PATH) and os.path.exists(VOCAB_PATH)):
            return
        with open(VOCAB_PATH, "rb") as f:
            self.vocab = pickle.load(f)
        self.model = MrXBrain().to(self.device)
        self.model.load_state_dict(
            torch.load(MODEL_PATH, map_location=self.device, weights_only=True)
        )
        self.model.eval()

    def is_loaded(self) -> bool:
        return self.model is not None

    def _encode(self, text: str) -> torch.Tensor:
        tokens = tokenize(text)[:MAX_LEN]
        ids    = [self.vocab.get(t, 1) for t in tokens]
        ids   += [0] * (MAX_LEN - len(ids))
        return torch.tensor([ids], dtype=torch.long).to(self.device)

    def analyze(self, text: str) -> BrainResult:
        """Analyse un message et retourne les 4 prédictions."""
        if not self.is_loaded():
            return BrainResult(0.0, 0.0, 0.5, 0, [1.0, 0.0, 0.0])

        with torch.no_grad():
            out        = self.model(self._encode(text))
            spam       = float(out["spam"].item())
            tox        = float(out["tox"].item())
            xp         = float(out["xp"].item())
            eco_logits = out["eco"][0]
            eco_probs  = torch.softmax(eco_logits, dim=0).tolist()
            eco_label  = int(torch.argmax(eco_logits).item())

        return BrainResult(spam, tox, xp, eco_label, eco_probs)
