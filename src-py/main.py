#activate venv: source venv/bin/activate
#freeze requirements: pip freeze > requirements.txt

from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def home():
    return {"status": "Backend Python activo"}

if __name__ == "__main__":
    # Esto mantiene el servidor corriendo en http://127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)