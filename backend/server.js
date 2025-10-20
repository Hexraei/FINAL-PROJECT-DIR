const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { syncModels } = require('./models');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const productRoutes = require('./routes/products');

const app = express();

// --- CORS Configuration ---
// For singular deployment, a simple cors() config is sufficient.
// For a separate frontend host, you would add a specific origin.
app.use(cors());

// Middleware
app.use(express.json());

// Synchronize database models on server start
syncModels();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes);

// --- Static File Serving & Frontend Routing ---
app.use(express.static(path.join(__dirname, '..')));

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.get(['/register', '/register.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'register.html')));
app.get(['/official-entry', '/official-entry.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'official-entry.html')));
app.get(['/reports-view', '/reports-view.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'reports-view.html')));
app.get(['/forgot-password', '/forgot-password.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'forgot-password.html')));
app.get('/reset-password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'reset-password.html')));
app.get(['/product-management', '/product-management.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'product-management.html')));

// Fallback to index page for any other route
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'index.html'));
});

// Render provides the PORT environment variable for deployment
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));