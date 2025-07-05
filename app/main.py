import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .database import engine, qdrant_client
from .routers import corpus, conversations
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RAGonQuest", description="RAG Application with Qdrant and SQLite")

# Mount static files for the frontend
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")     # For development
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(corpus.router)
app.include_router(conversations.router)

@app.get("/")
async def root():
    """Serve the frontend application or API info if frontend not available."""
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
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

@app.get("/{full_path:path}")
async def catch_all(full_path: str, request: Request):
    """Catch-all route for client-side routing."""
    # Don't interfere with API routes
    if full_path.startswith(("corpora", "health", "docs", "openapi.json", "static")):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Serve the frontend for all other routes
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    else:
        raise HTTPException(status_code=404, detail="Not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 