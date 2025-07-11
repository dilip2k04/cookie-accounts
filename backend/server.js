import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

// Middleware for production
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Request logging
app.use(cookieParser()); // Parse cookies
app.use(express.json());

// Dynamic CORS for dev and production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  // Add production frontend URL after deployment (e.g., 'https://cookie-finance-frontend.vercel.app')
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Environment validation
if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error('Missing MONGO_URI, JWT_SECRET, or REFRESH_TOKEN_SECRET in .env');
  process.exit(1);
}

// MongoDB Connection with retry logic
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
    await seedUsers();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    setTimeout(connectMongoDB, 5000); // Retry after 5 seconds
  }
};
connectMongoDB();

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: String,
  refreshToken: String // Store refresh token
});
const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Seed Founders
async function seedUsers() {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log('Users already seeded');
    return;
  }

  const founders = [
    { email: 'vignesh@cookie.com', password: 'CEO123', name: 'Vignesh' },
    { email: 'dilip@cookie.com', password: 'CTO123', name: 'Dilip' },
    { email: 'rajkaran@cookie.com', password: 'COO123', name: 'Raj' },
    { email: 'kishor@cookie.com', password: 'CMO123', name: 'Kishor' },
    { email: 'arulraj@cookie.com', password: 'CPO123', name: 'Arul' }
  ];

  for (const founder of founders) {
    const hashedPassword = await bcrypt.hash(founder.password, 10);
    const user = new User({
      email: founder.email,
      password: hashedPassword,
      name: founder.name
    });
    await user.save();
    console.log(`Seeded user: ${founder.name}`);
  }
}

// JWT Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Access denied: User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: `Invalid token: ${err.message}` });
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: `Login failed: ${err.message}` });
  }
});

app.post('/api/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: `Invalid refresh token: ${err.message}` });
  }
});

app.post('/api/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: 'No refresh token provided' });
  }
  try {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: `Logout failed: ${err.message}` });
  }
});

app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('createdBy', 'name');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch transactions: ${err.message}` });
  }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
  const { type, amount, category, description } = req.body;
  if (!type || !amount || !category) {
    return res.status(400).json({ error: 'Type, amount, and category are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  try {
    const transaction = new Transaction({
      type,
      amount,
      category,
      description,
      createdBy: req.user._id
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: `Invalid data: ${err.message}` });
  }
});

app.get('/api/summary', authMiddleware, async (req, res) => {
  try {
    const income = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expense = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({
      totalIncome: income[0]?.total || 0,
      totalExpense: expense[0]?.total || 0,
      balance: (income[0]?.total || 0) - (expense[0]?.total || 0)
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch summary: ${err.message}` });
  }
});

// Trust proxy for production (e.g., behind Render/Vercel reverse proxy)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));