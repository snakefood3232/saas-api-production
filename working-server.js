const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Check if public directory exists
const publicPath = path.join(__dirname, 'public');
console.log('Checking for public directory at:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    console.log('Files in public directory:', files);
}

// Middleware
app.use(express.json());

// Manually serve static files with logging
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.path}`);
    
    // Try to serve static files manually
    if (req.path === '/' || req.path === '/index.html') {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        console.log('Serving index.html from:', indexPath);
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    
    // Try to serve any file from public
    const filePath = path.join(__dirname, 'public', req.path.replace('/', ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        console.log('Serving file:', filePath);
        return res.sendFile(filePath);
    }
    
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Realtalk AI Backend is healthy!'
    });
});

// Dashboard API endpoints
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        users: 2453,
        revenue: 48275,
        orders: 846,
        projects: 142,
        userChange: 12,
        revenueChange: 23,
        orderChange: -5,
        projectChange: 8
    });
});

app.get('/api/dashboard/activity', (req, res) => {
    res.json([
        {
            id: 1,
            type: 'user',
            title: 'New user registered',
            description: 'Sarah Johnson joined the platform',
            time: '2m ago',
            icon: '👤'
        },
        {
            id: 2,
            type: 'payment',
            title: 'Payment received',
            description: 'Invoice #1847 has been paid',
            time: '1h ago',
            icon: '✅'
        }
    ]);
});

app.get('/api/dashboard/chart', (req, res) => {
    res.json({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        values: [8500, 10200, 7800, 12400, 9600, 13100, 8900]
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.path);
    res.status(404).json({ 
        message: `Cannot GET ${req.path}`,
        error: 'Not Found',
        statusCode: 404
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
================================
Server running on port ${PORT}
Test these URLs:
- http://localhost:${PORT}
- http://localhost:${PORT}/health
- http://localhost:${PORT}/api/dashboard/stats
================================
    `);
});