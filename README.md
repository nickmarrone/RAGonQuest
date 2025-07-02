# RAGonQuest
A Docker‑based RAG toolkit — Quest your data with RAGonQuest.

## Installation & Setup

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

### Development Workflow

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

### Troubleshooting

- **Port already in use**: Change the port in the uvicorn command
- **Database connection issues**: Check your DATABASE_URL in the .env file
- **Missing dependencies**: Run `uv sync` to reinstall dependencies
- **Migration errors**: Ensure your database is running and accessible
