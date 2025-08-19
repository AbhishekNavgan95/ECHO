# ECHO - Advanced Document Analysis with RAG

## 📌 Overview

ECHO is a sophisticated document analysis platform that leverages Retrieval-Augmented Generation (RAG) to provide intelligent, context-aware responses based on your documents. Built with a modern tech stack, ECHO allows users to upload various document formats and interact with them through natural language queries.

## 🎯 Key Features

- **Document Processing**: Supports multiple file formats including DOCX, PDF, and more
- **RAG-Powered**: Utilizes Retrieval-Augmented Generation for accurate, context-aware responses
- **Vector Database**: Implements Pinecone for efficient document retrieval
- **Modern UI**: Built with React and TailwindCSS for a responsive user experience
- **Scalable Backend**: Node.js/Express server with rate limiting and CORS support
- **AI Integration**: Leverages LangChain and OpenAI's advanced language models

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- Axios for API communication
- React Hot Toast for notifications

### Backend
- Node.js with Express
- LangChain for RAG implementation
- Pinecone as vector database
- Support for multiple document parsers (Cheerio, Mammoth, etc.)
- Rate limiting and CORS protection

## 🚀 How It Works

1. **Document Ingestion**:
   - Users upload documents through the web interface
   - Documents are processed and split into manageable chunks
   - Text is converted into vector embeddings using language models
   - Vectors are stored in Pinecone for efficient retrieval

2. **Query Processing**:
   - User queries are converted to vector embeddings
   - System retrieves the most relevant document chunks
   - The RAG model generates responses using both the query and retrieved context

3. **Response Generation**:
   - Combines retrieved information with the language model's knowledge
   - Provides accurate, well-cited responses
   - Returns sources for verification

## 🏗️ Project Structure

```
echo/
├── frontend/          # React frontend application
│   ├── public/        # Static assets
│   └── src/           # Source code
│       ├── assets/    # Images and other media
│       └── utils/     # Utility functions
└── backend/           # Node.js backend
    └── index.js       # Main server file
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Pinecone account and API key
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd echo
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your API keys
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Start the development servers:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory (new terminal)
   npm run dev
   ```

## 🌐 Environment Variables

Backend `.env` file should include:
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=quickstart
PINECONE_REGION=us-east-1
EMBEDDING_MODEL=text-embedding-3-small

# Auth & DB
JWT_SECRET=change-me
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
      =mongodb://127.0.0.1:27017/echo
FRONTEND_ORIGIN=http://localhost:5173
```

## 📚 Understanding RAG (Retrieval-Augmented Generation)

RAG is an advanced AI framework that combines the power of:
- **Retrieval**: Finding relevant information from a knowledge base
- **Generation**: Creating natural language responses using large language models

### How RAG Enhances Responses
1. **Contextual Understanding**: Retrieves relevant document passages
2. **Factual Accuracy**: Grounds responses in actual document content
3. **Transparency**: Provides sources for verification
4. **Flexibility**: Can be updated by simply adding new documents

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

For any inquiries or support, please open an issue in the repository.
