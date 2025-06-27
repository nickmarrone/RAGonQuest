from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import text
from .database import engine, qdrant_client
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="RAGonQuest", description="RAG Application with Qdrant and SQLite")

@app.get("/")
async def root():
    return {"message": "RAGonQuest API"}

@app.get("/health")
async def health_check():
    """
    Health check endpoint that tests connections to both Qdrant and SQLite databases.
    Returns a JSON response with the status of each database connection.
    """
    health_status = {}
    
    # Test SQLite connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        health_status["sqlite"] = "UP"
    except Exception as e:
        health_status["sqlite"] = "DOWN"
    
    # Test Qdrant connection using the pre-initialized client
    try:
        # Test the connection by getting collections
        qdrant_client.get_collections()
        health_status["qdrant"] = "UP"
    except Exception as e:
        health_status["qdrant"] = "DOWN"
    
    # Return 200 if both databases are UP, otherwise 503
    if all(status == "UP" for status in health_status.values()):
        return JSONResponse(content=health_status, status_code=200)
    else:
        return JSONResponse(content=health_status, status_code=503)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 