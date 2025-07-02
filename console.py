#!/usr/bin/env python3
"""
RAGonQuest Console - Interactive Python REPL with project resources

This script provides an interactive Python console with access to:
- Database models and session
- All Pydantic schemas
- Services and utilities
- FastAPI app instance

Usage:
    python console.py
    or
    uv run python console.py
"""

import os
import sys
import importlib
import inspect
from pathlib import Path
from typing import Optional, Dict, Any

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import core database and app components
from app.database import get_db, engine, Base
from app.main import app
from sqlalchemy.orm import Session
from sqlalchemy import text

def import_all_models() -> Dict[str, Any]:
    """Dynamically import all models from app.models"""
    model_dict = {}
    try:
        from app import models
        for name, obj in inspect.getmembers(models):
            if inspect.isclass(obj) and hasattr(obj, '__tablename__'):
                model_dict[name] = obj
        print(f"✅ Loaded {len(model_dict)} database models")
    except ImportError as e:
        print(f"⚠️  Could not import models: {e}")
    return model_dict

def import_all_schemas() -> Dict[str, Any]:
    """Dynamically import all schemas from app.schemas"""
    schema_dict = {}
    try:
        from app import schemas
        for name, obj in inspect.getmembers(schemas):
            if inspect.isclass(obj) and hasattr(obj, '__bases__'):
                # Check if it's a Pydantic model
                if any('pydantic' in str(base) for base in obj.__bases__):
                    schema_dict[name] = obj
        print(f"✅ Loaded {len(schema_dict)} Pydantic schemas")
    except ImportError as e:
        print(f"⚠️  Could not import schemas: {e}")
    return schema_dict

def import_all_services() -> Dict[str, Any]:
    """Dynamically import all services from app.services"""
    service_dict = {}
    try:
        services_dir = Path(__file__).parent / "app" / "services"
        if services_dir.exists():
            for service_file in services_dir.glob("*.py"):
                if service_file.name != "__init__.py":
                    module_name = f"app.services.{service_file.stem}"
                    try:
                        module = importlib.import_module(module_name)
                        for name, obj in inspect.getmembers(module):
                            if inspect.isfunction(obj) or inspect.isclass(obj):
                                service_dict[f"{service_file.stem}_{name}"] = obj
                    except ImportError as e:
                        print(f"⚠️  Could not import {module_name}: {e}")
        print(f"✅ Loaded {len(service_dict)} service functions/classes")
    except Exception as e:
        print(f"⚠️  Could not import services: {e}")
    return service_dict

class RAGonQuestConsole:
    """Interactive console with project resources"""
    
    def __init__(self):
        self.db: Optional[Session] = None
        self.setup_database()
    
    def setup_database(self):
        """Initialize database connection"""
        try:
            self.db = next(get_db())
            print("✅ Database connection established")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print("Make sure your DATABASE_URL is configured correctly in .env")
            self.db = None
    
    def show_help(self):
        """Show available commands and examples"""
        help_text = """
🤖 RAGonQuest Console - Available Resources

📊 Database:
  db                                    # Database session
  Session                               # SQLAlchemy Session class
  text                                  # SQLAlchemy text function

🔧 Core Components:
  app                                   # FastAPI app instance
  engine                                # Database engine
  Base                                  # SQLAlchemy Base class

📋 Available Models and Schemas:
  All database models and Pydantic schemas are automatically imported
  and available in the namespace. Use dir() to explore:

  dir()                                 # Show all available objects
  [name for name in dir() if 'Corpus' in name]  # Find corpus-related objects

💡 Examples:
  # List all corpora (if Corpus model exists)
  corpora = db.query(Corpus).all()
  for c in corpora:
      print(f"{c.name}: {c.id}")

  # Create a new corpus (if Corpus model exists)
  corpus = Corpus(name="My Documents", path="/path/to/docs")
  db.add(corpus)
  db.commit()

  # Use schemas for validation
  corpus_data = CorpusCreate(name="Test", default_prompt="Answer questions")
  
  # Access services (if they exist)
  # cost = estimate_embedding_cost_for_corpus(corpus)

🔧 Type 'exit()' or Ctrl+D to quit
"""
        print(help_text)

def main():
    """Main console entry point"""
    print("🚀 Starting RAGonQuest Console...")
    print("=" * 50)
    
    # Initialize console
    console = RAGonQuestConsole()
    
    # Dynamically import all components
    model_dict = import_all_models()
    schema_dict = import_all_schemas()
    service_dict = import_all_services()
    
    # Set up namespace for the REPL
    namespace = {
        'console': console,
        'app': app,
        'db': console.db,
        'engine': engine,
        'Base': Base,
        'Session': Session,
        'text': text,
    }
    
    # Add all dynamically imported components
    namespace.update(model_dict)
    namespace.update(schema_dict)
    namespace.update(service_dict)
    
    # Show welcome message and help
    print("🎯 Welcome to RAGonQuest Console!")
    print("📚 All project resources are automatically imported")
    print("💡 Type 'console.show_help()' for available commands")
    print("🔍 Type 'dir()' to explore all available objects")
    print("🔧 Type 'exit()' or Ctrl+D to quit")
    print("=" * 50)
    
    try:
        # Start interactive console
        import code
        code.interact(local=namespace, banner="")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    finally:
        if console.db:
            console.db.close()
            print("🔒 Database connection closed")

if __name__ == "__main__":
    main() 