"""
Script d'initialisation de MrXBrain.
Lance-le UNE SEULE FOIS avant de démarrer l'API.

    python setup.py
"""
import subprocess
import sys
import os


def install_deps():
    print("📦 Installation des dépendances...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"
    ])
    print("  ✅ Dépendances installées")


def create_env():
    if not os.path.exists(".env"):
        import shutil
        shutil.copy(".env.example", ".env")
        print("  ✅ Fichier .env créé (pense à changer BRAIN_API_KEY !)")
    else:
        print("  ✅ .env déjà présent")


def train_model():
    print("\n🧠 Entraînement du réseau neuronal...")
    from ml.train import train
    train(epochs=50, verbose=True)


def verify():
    print("\n🔍 Vérification rapide...")
    from ml.model import MrXBrainInference
    brain = MrXBrainInference()

    tests = [
        ("FREE NITRO discord.gg/xyz @everyone",  True,  False),
        ("va te faire foutre sale noob",          False, True),
        ("salut comment tu vas ?",                False, False),
        ("je farm mes coins depuis ce matin",     False, False),
    ]
    ok = True
    for text, expect_spam, expect_tox in tests:
        r = brain.analyze(text)
        spam_ok = (r.spam >= 0.5) == expect_spam
        tox_ok  = (r.toxicity >= 0.5) == expect_tox
        icon = "✅" if (spam_ok and tox_ok) else "⚠️"
        print(
            f"  {icon} [{text[:45]:<45}]"
            f"  spam={r.spam:.2f}  tox={r.toxicity:.2f}"
            f"  xp={r.xp_score:.2f}  eco={r.eco_name}"
        )
        if not (spam_ok and tox_ok):
            ok = False
    return ok


if __name__ == "__main__":
    print("=" * 55)
    print("  🧠 MrXBrain — Setup initial")
    print("=" * 55)

    install_deps()
    create_env()
    train_model()
    ok = verify()

    print()
    if ok:
        print("✅ MrXBrain est prêt !")
        print("   Lance le serveur avec : python start.py")
        print("   (ou : start.bat sous Windows)")
    else:
        print("⚠️  Quelques prédictions incorrectes.")
        print("   Relance avec plus d'epochs : python -m ml.train --epochs 80")
