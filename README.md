# RAGonQuest

![RAGonQuest Logo](ragonquest_logo.png)

A Docker-based RAG (Retrieval-Augmented Generation) toolkit that enables you to build powerful question-answering systems over your own documents. RAGonQuest combines the power of OpenAI's language models with Qdrant vector database to provide accurate, context-aware responses based on your custom knowledge base.

## What RAGonQuest Does

RAGonQuest is a comprehensive RAG application that allows you to:

- **Ingest Documents**: Upload and process text files into searchable knowledge bases
- **Create Corpora**: Organize your documents into logical collections with custom prompts
- **Semantic Search**: Use advanced vector embeddings to find relevant information
- **Conversational AI**: Have natural conversations with your data using OpenAI's language models
- **Cost Estimation**: Get detailed cost estimates before processing large document collections
- **Conversation History**: Maintain full conversation history with context and sources
- **RESTful API**: Access all functionality through a well-documented FastAPI interface

The system uses:
- **FastAPI** for the web framework
- **Qdrant** for vector storage and similarity search
- **SQLite** for metadata and conversation storage
- **OpenAI** for embeddings and language model completions
- **Docker** for easy deployment and development

## Quick Start with Docker

The easiest way to get RAGonQuest running is using Docker Compose, which will set up both the application and the required Qdrant vector database.

### Prerequisites

- Docker and Docker Compose installed on your system
- OpenAI API key

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RAGonQuest
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```

3. **Edit the `.env` file** with your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the services**:
   ```bash
   docker-compose up -d
   ```

5. **Access the application**:
   - API: http://localhost:8000
   - Interactive API docs: http://localhost:8000/docs
   - ReDoc documentation: http://localhost:8000/redoc

### Docker Services

The Docker Compose setup includes:

- **ragonquest**: The main FastAPI application
- **qdrant**: Vector database for storing embeddings
- **Volumes**: Persistent storage for data and Qdrant collections

### Stopping the Services

```bash
docker-compose down
```

To remove all data (including Qdrant storage):
```bash
docker-compose down -v
```

## Manual Installation & Setup

If you prefer to run RAGonQuest without Docker, follow these instructions:

### Prerequisites

- Python 3.8 or higher
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver
- SQLite

### Installing Dependencies

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RAGonQuest
   ```

3. **Install dependencies using uv**:
   ```bash
   uv sync
   ```

   This will:
   - Create a virtual environment
   - Install all dependencies from `requirements.txt`
   - Generate lock files for reproducible builds

### Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file** with your configuration:
   ```bash
   # Database configuration
   DATABASE_URL=sqlite:///data/ragonquest.db
   
   # OpenAI API configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Qdrant configuration
   QDRANT_URL=http://localhost:6333
   ```

### Database Setup

1. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```

### Running the Server

#### Development Mode

1. **Start the FastAPI development server**:
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Access the API**:
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - ReDoc docs: http://localhost:8000/redoc

#### Production Mode

1. **Start the production server**:
   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### Alternative: Using uvx for Direct Execution

You can also run commands directly without activating the virtual environment:

```bash
# Run the server
uvx uvicorn app.main:app --reload

# Run migrations
uvx alembic upgrade head

# Run tests
uvx pytest
```

## Development Workflow

1. **Activate the virtual environment** (optional with uv):
   ```bash
   source .venv/bin/activate  # Linux/macOS
   # or
   .venv\Scripts\activate     # Windows
   ```

2. **Install new dependencies**:
   ```bash
   uv add package_name
   ```

3. **Update dependencies**:
   ```bash
   uv sync --upgrade
   ```

4. **Run linting and formatting**:
   ```bash
   uv run black .
   uv run isort .
   uv run flake8 .
   ```

## API Usage

### Creating a Corpus

1. Create a corpus to organize your documents:
   ```bash
   curl -X POST "http://localhost:8000/corpora/" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "my_documents",
       "description": "My document collection",
       "path": "/app/corpora/my_documents"
     }'
   ```

2. Scan for text files in the corpus directory:
   ```bash
   curl -X POST "http://localhost:8000/corpora/{corpus_id}/scan"
   ```

3. Get cost estimates before ingestion:
   ```bash
   curl "http://localhost:8000/corpora/{corpus_id}/cost_estimate"
   ```

4. Ingest documents into the vector database:
   ```bash
   curl -X POST "http://localhost:8000/corpora/{corpus_id}/ingest"
   ```

### Querying Your Data

1. Create a conversation with your data:
   ```bash
   curl -X POST "http://localhost:8000/corpora/{corpus_id}/conversations" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "My Question",
       "query": "What is the main topic of the documents?"
     }'
   ```

2. Continue an existing conversation:
   ```bash
   curl -X POST "http://localhost:8000/corpora/{corpus_id}/conversations/{conversation_id}/continue" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "Can you elaborate on that?"
     }'
   ```

## Troubleshooting

- **Port already in use**: Change the port in the uvicorn command or Docker configuration
- **Database connection issues**: Check your DATABASE_URL in the .env file
- **Missing dependencies**: Run `uv sync` to reinstall dependencies
- **Migration errors**: Ensure your database is running and accessible
- **Docker issues**: Check that Docker and Docker Compose are properly installed
- **Qdrant connection**: Ensure the Qdrant service is running on port 6333
- **OpenAI API errors**: Verify your API key is correct and has sufficient credits

## License

This project is licensed under the terms specified in the LICENSE file.
