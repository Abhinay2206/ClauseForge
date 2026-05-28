const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const pdf = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/huggingface_transformers');
const { Chroma } = require('@langchain/community/vectorstores/chroma');
const { ChromaClient } = require('chromadb');
const DocumentModel = require('../models/Document');
const { scanBuffer } = require('./virusScanner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const processDocumentForRAG = async (documentId) => {
  try {
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    console.log(`Starting RAG processing for document ${documentId}`);

    // 1. Fetch file from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: document.s3Key,
    });
    const s3Response = await s3Client.send(getObjectCommand);
    const fileBuffer = await streamToBuffer(s3Response.Body);

    // 1.5 Scan for viruses
    console.log(`Scanning document ${documentId} for viruses...`);
    await scanBuffer(fileBuffer);

    // 2. Extract Text
    let rawText = '';
    if (document.type === 'application/pdf') {
      const pdfData = await pdf(fileBuffer);
      rawText = pdfData.text;
    } else {
      // For now, assuming standard text formats if not PDF. 
      // Could be extended for docx, images (OCR), etc.
      rawText = fileBuffer.toString('utf8');
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Extracted text is empty');
    }

    // 3. Chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.createDocuments(
      [rawText],
      [{ documentId: document._id.toString(), userId: document.user.toString(), fileName: document.name }]
    );

    console.log(`Chunked into ${docs.length} segments.`);

    // 4. Embeddings & 5. Storage (ChromaDB)
    // Connecting to ChromaDB (Local or Cloud)
    const clientOptions = {};
    if (process.env.CHROMA_HOST) {
      clientOptions.host = process.env.CHROMA_HOST;
      clientOptions.port = 443;
      clientOptions.ssl = true;
      if (process.env.CHROMA_TENANT) clientOptions.tenant = process.env.CHROMA_TENANT;
      if (process.env.CHROMA_DATABASE) clientOptions.database = process.env.CHROMA_DATABASE;
      if (process.env.CHROMA_API_KEY) {
        clientOptions.headers = {
          "x-chroma-token": process.env.CHROMA_API_KEY
        };
      }
    } else {
      clientOptions.host = 'localhost';
      clientOptions.port = 8000;
      clientOptions.ssl = false;
    }

    const chromaClient = new ChromaClient(clientOptions);

    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/bge-small-en-v1.5",
    });

    const vectorStore = await Chroma.fromDocuments(docs, embeddings, {
      collectionName: 'clause_forge_documents',
      index: chromaClient,
    });

    console.log(`Successfully stored ${docs.length} chunks in ChromaDB.`);

    return true;
  } catch (error) {
    console.error(`Error processing document ${documentId} for RAG:`, error);
    throw error;
  }
};

module.exports = {
  processDocumentForRAG
};
