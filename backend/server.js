const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const productRoutes = require('./routes/products'); // <-- ADD THIS

const app = express();

// Middleware
// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5001', // Your local server (for serving files)
    'https://your-live-frontend-site.netlify.app' // We will get this URL from Netlify
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};
app.use(cors(corsOptions));
// --- End CORS Configuration ---
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes); // <-- ADD THIS

// --- Static File Serving & Frontend Routing ---
app.use(express.static(path.join(__dirname, '..')));

app.get(['/', '/login', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});
app.get(['/register', '/register.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'register.html'));
});
app.get(['/official-entry', '/official-entry.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'official-entry.html'));
});
app.get(['/reports-view', '/reports-view.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'reports-view.html'));
});
app.get(['/forgot-password', '/forgot-password.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'forgot-password.html'));
});
app.get('/reset-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'reset-password.html'));
});
// Add route for new product management page
app.get(['/product-management', '/product-management.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'product-management.html'));
});

// Fallback to login page
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'login.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
