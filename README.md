<div align="center">
  <div style="background-color: #2563EB; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8.5C5.5 8.5 7 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11C7 11 5.5 9.5 5.5 9.5Z"/><path d="M18.5 8.5C18.5 8.5 17 7 16 7C14.8954 7 14 7.89543 14 9C14 10.1046 14.8954 11 16 11C17 11 18.5 9.5 18.5 9.5Z"/><path d="M5.5 15.5C5.5 15.5 7 17 8 17C9.10457 17 10 16.1046 10 15C10 13.8954 9.10457 13 8 13C7 13 5.5 14.5 5.5 14.5Z"/><path d="M18.5 15.5C18.5 15.5 17 17 16 17C14.8954 17 14 16.1046 14 15C14 13.8954 14.8954 13 16 13C17 13 18.5 14.5 18.5 14.5Z"/><path d="M12 12V21"/><path d="M12 12L7 7"/><path d="M12 12L17 7"/></svg>
  </div>
  <h1>ClauseForge</h1>
  <p><strong>Next-Generation AI Legal Contract Analysis & Intelligence Platform</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/Python-AI_Microservices-yellow?style=flat-square&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  </p>
</div>

---

## 📖 Overview

**ClauseForge** is an advanced, AI-driven legal-tech platform designed to automate and augment contract analysis. By leveraging cutting-edge large language models (LLMs) and semantic search architectures, ClauseForge empowers legal professionals, compliance teams, and businesses to upload contracts and instantly receive comprehensive risk assessments, clause breakdowns, and conversational insights.

With a meticulously designed, Notion/Linear-inspired user interface, the platform offers a premium software experience tailored for complex professional workflows.

---

## ✨ Core Features

### 🔍 Automated Contract Analysis
Upload your legal documents (PDF, DOCX, TXT) and let ClauseForge's AI engine scan them. The system automatically identifies standard and non-standard clauses, extracts key entities, and flags anomalies.

### 🛡️ Intelligent Risk Scoring
Every document undergoes a rigorous risk assessment. ClauseForge assigns a **High, Medium, or Low** risk level, alongside a granular Risk Score (out of 100). The AI surfaces the exact text segments causing the risk and explains *why* it is a liability in plain English.

### 💬 Context-Aware AI Assistant
Talk to your contracts. The built-in AI Assistant allows you to ask direct, complex questions about specific documents. Utilizing semantic vector search, it distinguishes between "New Queries" (which require searching the document) and "Follow-up Queries" (which utilize conversational context), ensuring highly accurate and fluid interactions. Streaming responses deliver a ChatGPT-like experience.

### ⚖️ Document Comparison
Upload multiple iterations of an agreement (e.g., MSA v1 vs. MSA v2). ClauseForge performs intelligent diffing to surface material changes, additions, and deletions, bypassing superficial formatting differences.

### 📊 Automated PDF Reporting
Generate and export beautiful, professional-grade PDF reports of your risk analyses and clause breakdowns with a single click, ready to be shared with stakeholders or clients.

### 🔐 Advanced Admin Console
A robust role-based access control (RBAC) system featuring `User`, `Support`, `Moderator`, and `System Admin` roles. The Admin Portal provides full control over:
- **User Management**: Monitor logins, suspend/block users, and manage access levels.
- **Document Management**: Overview of system-wide storage, document status tracking, and direct administrative actions.
- **Analytics & Security**: Track platform health, failed login attempts, and system audits.

---

## 🏗️ Architecture & Tech Stack

ClauseForge is built on a modern, decoupled microservices architecture to ensure scalability, rapid iteration, and specialized environments for AI processing.

### Frontend (User Interface & Experience)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Custom UI design system with glassmorphism and subtle animations)
- **State Management**: Zustand (Global state for Auth, UI, Documents)
- **Routing**: React Router v7
- **Icons & Visuals**: Lucide React
- **Exporting**: jsPDF & html2pdf.js

### Backend (Core API & Data Management)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt hashing
- **File Handling**: Multer for document ingestion

### AI Microservices (Intelligence Layer)
- **Runtime**: Python
- **LLM Integration**: Groq API (Utilizing state-of-the-art open-weights models like Llama 3)
- **Vector Search & Embeddings**: Semantic chunking and vector retrieval for the conversational RAG (Retrieval-Augmented Generation) pipeline.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB instance (local or Atlas)
- Groq API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/clauseforge.git
cd clauseforge
```

### 2. Setup the Backend
```bash
cd backend
npm install

# Create a .env file and configure your environment variables
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret

npm run dev
```

### 3. Setup the AI Microservices
```bash
cd ../ai_microservices

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file
# GROQ_API_KEY=your_api_key

python main.py
```

### 4. Setup the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## 🎨 UI/UX Philosophy

ClauseForge is built with a focus on "Premium Professionalism." We avoid generic templates in favor of tailored design tokens.
- **Typography**: Crisp, highly readable sans-serif fonts optimized for dense data.
- **Color Palette**: A controlled slate neutral scale combined with purpose-driven semantic colors (Blue for action, Red for risk).
- **Micro-interactions**: Subtle hover states, smooth page transition loaders, and pulsing indicators to keep the interface feeling alive and responsive.
- **Layout**: Clean, spacious dashboards that prioritize content readability over visual clutter.

---


