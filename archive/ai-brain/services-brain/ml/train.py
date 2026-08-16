"""
Entraînement de MrXBrain (multi-tâches).

Usage :
    python -m ml.train
    python -m ml.train --epochs 60
"""
from __future__ import annotations

import argparse
import pickle
import random
import sqlite3
from collections import Counter

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from .data import TRAINING_DATA
from .model import (
    EMBED_DIM, HIDDEN_DIM, MAX_LEN, MODEL_PATH, VOCAB_PATH, VOCAB_SIZE,
    MrXBrain, tokenize,
)

DB_PATH = "brain.db"


def build_vocab(texts: list[str]) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for t in texts:
        counter.update(tokenize(t))
    # 0=PAD  1=UNK  2+=tokens
    return {w: i + 2 for i, (w, _) in enumerate(counter.most_common(VOCAB_SIZE))}


def encode_texts(texts: list[str], vocab: dict[str, int]) -> torch.Tensor:
    rows = []
    for t in texts:
        ids  = [vocab.get(tok, 1) for tok in tokenize(t)[:MAX_LEN]]
        ids += [0] * (MAX_LEN - len(ids))
        rows.append(ids)
    return torch.tensor(rows, dtype=torch.long)


def load_custom_data() -> list[tuple[str, int, int, float, int]]:
    """Charge les exemples ajoutés via l'API /label."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute(
                "SELECT text, spam, toxique, xp, eco FROM training_data"
            ).fetchall()
        return [(r[0], r[1], r[2], float(r[3]), r[4]) for r in rows]
    except Exception:
        return []


def train(
    extra_data: list[tuple[str, int, int, float, int]] | None = None,
    epochs:     int   = 50,
    batch_size: int   = 16,
    lr:         float = 0.001,
    verbose:    bool  = True,
) -> MrXBrain:
    data = list(TRAINING_DATA) + (extra_data or []) + load_custom_data()
    random.shuffle(data)

    texts  = [d[0] for d in data]
    spam   = [d[1] for d in data]
    tox    = [d[2] for d in data]
    xp     = [d[3] for d in data]
    eco    = [d[4] for d in data]

    vocab = build_vocab(texts)
    with open(VOCAB_PATH, "wb") as f:
        pickle.dump(vocab, f)

    X     = encode_texts(texts, vocab)
    y_sp  = torch.tensor(spam, dtype=torch.float32).unsqueeze(1)
    y_tox = torch.tensor(tox,  dtype=torch.float32).unsqueeze(1)
    y_xp  = torch.tensor(xp,   dtype=torch.float32).unsqueeze(1)
    y_eco = torch.tensor(eco,  dtype=torch.long)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    loader = DataLoader(
        TensorDataset(X, y_sp, y_tox, y_xp, y_eco),
        batch_size=batch_size, shuffle=True,
    )

    model = MrXBrain(VOCAB_SIZE, EMBED_DIM, HIDDEN_DIM).to(device)
    optim = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    bce   = nn.BCELoss()
    mse   = nn.MSELoss()
    ce    = nn.CrossEntropyLoss()

    W_SPAM, W_TOX, W_XP, W_ECO = 2.0, 1.5, 1.0, 1.0

    model.train()
    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        correct_spam = correct_eco = 0

        for xb, sp, tx, xpb, ecob in loader:
            xb, sp, tx, xpb, ecob = (
                xb.to(device), sp.to(device), tx.to(device),
                xpb.to(device), ecob.to(device),
            )
            optim.zero_grad()
            out = model(xb)
            loss = (
                W_SPAM * bce(out["spam"], sp)
                + W_TOX * bce(out["tox"],  tx)
                + W_XP  * mse(out["xp"],  xpb)
                + W_ECO * ce(out["eco"],  ecob)
            )
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optim.step()

            total_loss   += loss.item()
            correct_spam += int(((out["spam"] >= 0.5) == sp).sum().item())
            correct_eco  += int((out["eco"].argmax(1) == ecob).sum().item())

        if verbose and epoch % 5 == 0:
            n = len(data)
            print(
                f"  Epoch {epoch:3d}/{epochs} | loss={total_loss:.4f}"
                f" | spam_acc={correct_spam/n*100:.1f}%"
                f" | eco_acc={correct_eco/n*100:.1f}%"
            )

    torch.save(model.state_dict(), MODEL_PATH)
    if verbose:
        print(f"\n✅ Modèle sauvegardé → {MODEL_PATH}")
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entraîne MrXBrain")
    parser.add_argument("--epochs", type=int,   default=50)
    parser.add_argument("--lr",     type=float, default=0.001)
    args = parser.parse_args()

    print("🧠 Entraînement de MrXBrain (multi-tâches)...")
    print(f"   epochs={args.epochs}  lr={args.lr}\n")
    train(epochs=args.epochs, lr=args.lr)
