require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/db');

// Route files
const authRoutes = require('./routes/authRoute');
const documentRoutes = require('./routes/documentRoute');
const chatRoutes = require('./routes/chatRoute');
const adminRoutes = require('./routes/adminRoute');
const emailRoutes = require('./routes/emailRoute');

// Worker services
const { initializeWorker } = require('./services/workerService');
require('./services/emailWorker');

const { apiLimiter } = require('./middleware/rateLimiter');
const { blockIP } = require('./middleware/blockIP');

const app = express();

// Connect to database
connectDB();

// Initialize BullMQ Worker
initializeWorker();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS with credentials
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// IP Block check (before rate limiter)
app.use(blockIP);

// Mount routers
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
