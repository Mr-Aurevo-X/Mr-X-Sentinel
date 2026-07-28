"""Lance le serveur MrXBrain API."""
import os
import sys

from dotenv import load_dotenv
import uvicorn

load_dotenv()

if __name__ == "__main__":
    api_key = (os.getenv("BRAIN_API_KEY") or "").strip()
    is_dev = (os.getenv("DEV") or "").strip() in ("1", "true", "True", "yes")
    if not api_key or api_key.lower() in {"changeme", "dev-brain-key"}:
        if not is_dev:
            print(
                "FATAL: BRAIN_API_KEY manquant ou valeur faible. "
                "Definissez une cle forte, ou DEV=1 pour le developpement local.",
                file=sys.stderr,
            )
            raise SystemExit(1)
        if not api_key:
            os.environ["BRAIN_API_KEY"] = "dev-local-only"
            print("WARN: DEV=1 — BRAIN_API_KEY absente, cle locale temporaire.", file=sys.stderr)

    port = int(os.getenv("BRAIN_PORT", 8765))
    host = (os.getenv("BRAIN_HOST") or "127.0.0.1").strip() or "127.0.0.1"
    print(f"MrXBrain API sur http://{host}:{port}")
    uvicorn.run("api:app", host=host, port=port, reload=False)
