# RAGonQuest

![RAGonQuest Logo](ragonquest_logo.png)

A comprehensive RAG (Retrieval-Augmented Generation) application that enables you to build powerful question-answering systems over your own documents. RAGonQuest combines the power of OpenAI's language models with Qdrant vector database to provide accurate, context-aware responses based on your custom knowledge base.

## What RAGonQuest Does

RAGonQuest is a full-stack RAG application that allows you to:

### Document Management
- **Create Knowledge Corpora**: Organize your documents into logical collections with custom configurations
- **File Scanning**: Automatically discover and add text files from specified directories
- **Document Ingestion**: Process and embed documents into searchable vector representations
- **File Tracking**: Monitor which files have been processed and which remain to be ingested

### AI-Powered Conversations
- **Natural Language Queries**: Ask questions in plain English and get intelligent responses
- **Context-Aware Responses**: AI generates answers based on relevant document chunks
- **Conversation History**: Maintain full conversation threads with context and sources
- **Multi-turn Conversations**: Continue conversations with follow-up questions
- **Source Attribution**: See which documents were used to generate each response

### Advanced Search & Retrieval
- **Semantic Search**: Use advanced vector embeddings to find relevant information
- **Configurable Similarity Thresholds**: Adjust how closely content must match your queries
- **Context Chunk Visualization**: View the exact text chunks used to generate responses
- **Flexible Retrieval Limits**: Control how many context chunks to retrieve

### Cost Management
- **Embedding Cost Estimation**: Get detailed cost estimates before processing large document collections
- **Per-File Cost Analysis**: See estimated costs for individual files
- **Batch Processing**: Process multiple files efficiently to optimize costs

### Modern Web Interface
- **Responsive Design**: Clean, modern UI built with React and Tailwind CSS
- **Real-time Updates**: Instant feedback on operations and conversation updates
- **Intuitive Navigation**: Easy switching between corpora and conversations
- **Context Visualization**: Click to view the source chunks used for each response
- **Conversation Management**: Create, view, and delete conversations easily

### Developer-Friendly Features
- **RESTful API**: Complete API with interactive documentation
- **Database Migrations**: Automated schema management with Alembic
- **Interactive Console**: Python REPL with access to all project resources
- **Docker Support**: Easy deployment with Docker Compose
- **Environment Configuration**: Flexible configuration management

## Architecture

The system uses a modern, scalable architecture:

- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite for metadata and conversation storage
- **Vector Database**: Qdrant for semantic search and embeddings
- **AI Services**: OpenAI for embeddings and language model completions
- **Frontend**: React with TypeScript and Tailwind CSS
- **State Management**: Jotai for reactive state management
- **Deployment**: Docker and Docker Compose for easy setup

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
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - ReDoc Documentation: http://localhost:8000/redoc

### Docker Services

The Docker Compose setup includes:

- **ragonquest**: The main FastAPI application with React frontend
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
- Node.js 18+ (for frontend development)

### Backend Setup

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RAGonQuest
   ```

3. **Install Python dependencies**:
   ```bash
   uv sync
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```

5. **Edit the `.env` file** with your configuration:
   ```bash
   # Database configuration
   DATABASE_URL=sqlite:///data/ragonquest.db
   
   # OpenAI API configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Qdrant configuration
   QDRANT_URL=http://localhost:6333
   ```

6. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```

7. **Start the FastAPI server**:
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the frontend**: http://localhost:5173

## Core Features in Detail

### Corpus Management

**Create and Configure Corpora**
- Define custom names, descriptions, and prompts for each corpus
- Set embedding and completion models (e.g., text-embedding-3-small, gpt-4o-mini)
- Configure similarity thresholds for search precision
- Specify file paths for document storage

**File Operations**
- Scan directories for .txt files automatically
- Track ingestion status of each file
- Batch process multiple files for embedding
- Monitor file processing progress

**Cost Estimation**
- Estimate embedding costs before processing
- View per-file cost breakdowns
- Calculate total corpus processing costs
- Optimize batch sizes for cost efficiency

### Conversation System

**Natural Language Interface**
- Ask questions in plain English
- Get context-aware responses from your documents
- Maintain conversation context across multiple turns
- View conversation history with timestamps

**Advanced Features**
- Configurable context retrieval limits
- Adjustable similarity thresholds per corpus
- Source attribution for all responses
- Context chunk visualization

**Conversation Management**
- Create new conversations with any corpus
- Continue existing conversations
- View all conversation parts with metadata
- Delete conversations when no longer needed

### Vector Search & Embeddings

**Semantic Search**
- Advanced vector embeddings using OpenAI models
- Configurable similarity thresholds (0.0-1.0)
- Flexible chunk sizes and overlap settings
- Batch processing for efficiency

**Context Retrieval**
- Intelligent chunk selection based on query relevance
- Configurable retrieval limits
- Source file tracking
- Chunk metadata preservation

### Web Interface

**Modern UI Components**
- Responsive sidebar with corpora and conversations
- Real-time conversation view with chat-like interface
- Context chunk visualization dialogs
- Toast notifications for user feedback

**Interactive Features**
- Dropdown menus for corpus and conversation actions
- Loading states and progress indicators
- Error handling with user-friendly messages
- Keyboard shortcuts (Enter to send, Escape to close dialogs)

## API Reference

### Corpus Endpoints

- `POST /corpora/` - Create a new corpus
- `GET /corpora/` - List all corpora
- `GET /corpora/{corpus_id}` - Get specific corpus
- `PATCH /corpora/{corpus_id}` - Update corpus
- `DELETE /corpora/{corpus_id}` - Delete corpus
- `POST /corpora/{corpus_id}/scan` - Scan for files
- `POST /corpora/{corpus_id}/ingest` - Ingest files to vector database
- `GET /corpora/{corpus_id}/cost_estimate` - Estimate embedding costs

### Conversation Endpoints

- `GET /corpora/{corpus_id}/conversations` - List conversations
- `GET /corpora/{corpus_id}/conversations/{conversation_id}` - Get conversation
- `POST /corpora/{corpus_id}/conversations` - Create new conversation
- `POST /corpora/{corpus_id}/conversations/{conversation_id}/continue` - Continue conversation
- `DELETE /corpora/{corpus_id}/conversations/{conversation_id}` - Delete conversation

## 🛠️ Development Tools

### Interactive Console

RAGonQuest includes an interactive Python console for development and debugging:

```bash
python console.py
# or
uv run python console.py
```

The console provides access to:
- Database models and sessions
- All Pydantic schemas
- Services and utilities
- FastAPI app instance

### Database Migrations

Manage database schema changes with Alembic:

```bash
# Create a new migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head

# Rollback migrations
uv run alembic downgrade -1
```

## Configuration Options

### Environment Variables

- `DATABASE_URL`: Database connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `QDRANT_URL`: Qdrant vector database URL
- `DEBUG`: Enable debug mode
- `LOG_LEVEL`: Logging level (INFO, DEBUG, etc.)

### Corpus Configuration

- **Embedding Models**: text-embedding-3-small, text-embedding-3-large
- **Completion Models**: gpt-4o-mini, gpt-4o, gpt-3.5-turbo
- **Similarity Thresholds**: 0.0-1.0 (higher = more precise matches)
- **Chunk Sizes**: Configurable token limits for text chunking
- **Batch Sizes**: Number of chunks to process simultaneously

## Usage Examples

### Creating a Corpus

1. Use the web interface to create a new corpus
2. Set the path to your document directory
3. Configure embedding and completion models
4. Set your preferred similarity threshold

### Processing Documents

1. Click "Scan for Files" to discover .txt files
2. Review the cost estimate before processing
3. Click "Ingest Files" to embed documents
4. Monitor progress and verify completion

### Starting Conversations

1. Select a corpus from the sidebar
2. Click "New Conversation" or select an existing one
3. Ask your first question
4. Continue the conversation with follow-ups

### Viewing Context

1. In any conversation, look for the document icon in AI responses
2. Click the icon to view the source chunks used
3. Review the exact text that informed the AI's response

## Troubleshooting

### Common Issues

- **Port already in use**: Change the port in the uvicorn command or Docker configuration
- **Database connection issues**: Check your DATABASE_URL in the .env file
- **Missing dependencies**: Run `uv sync` to reinstall dependencies
- **Migration errors**: Ensure your database is running and accessible
- **Docker issues**: Check that Docker and Docker Compose are properly installed
- **Qdrant connection**: Ensure the Qdrant service is running on port 6333
- **OpenAI API errors**: Verify your API key is correct and has sufficient credits

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=True uv run uvicorn app.main:app --reload
```

### Health Checks

Check service health:

```bash
curl http://localhost:8000/health
```

## License

This project is licensed under the terms specified in the LICENSE file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Support

If you encounter any issues or have questions, please:

1. Check the troubleshooting section above
2. Review the API documentation at `/docs`
3. Open an issue on the project repository
4. Check the logs for detailed error information
