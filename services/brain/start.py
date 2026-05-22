"""Lance le serveur MrXBrain API."""
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("BRAIN_PORT", 8765))
    print(f"🧠 MrXBrain API démarrée sur http://localhost:{port}")
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=False)
