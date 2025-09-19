const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Serve index.html content directly
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null;

app.get('/', (req, res) => {
    console.log('Root route requested');
    if (indexContent) {
        res.type('html').send(indexContent);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Realtalk AI</title></head>
            <body>
                <h1>Index.html not found</h1>
                <p>But the server is working!</p>
                <a href="/health">Check Health</a>
            </body>
            </html>
        `);
    }
});

// Also try to serve dashboard.html at /dashboard
const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
const dashboardContent = fs.existsSync(dashboardPath) ? fs.readFileSync(dashboardPath, 'utf8') : null;

app.get('/dashboard', (req, res) => {
    console.log('Dashboard route requested');
    if (dashboardContent) {
        res.type('html').send(dashboardContent);
    } else {
        res.send('Dashboard not found');
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Realtalk AI Backend is healthy!',
        indexFileExists: !!indexContent,
        dashboardFileExists: !!dashboardContent
    });
});

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

app.use((req, res) => {
    res.status(404).json({ 
        message: `Cannot GET ${req.path}`,
        error: 'Not Found',
        statusCode: 404
    });
});

app.listen(PORT, () => {
    console.log(`
================================
✅ Server running on port ${PORT}
✅ Index.html loaded: ${!!indexContent}
✅ Dashboard.html loaded: ${!!dashboardContent}

Try these URLs:
- http://localhost:${PORT}/ (main dashboard)
- http://localhost:${PORT}/dashboard (alternative dashboard)
- http://localhost:${PORT}/health (health check)
- http://localhost:${PORT}/api/dashboard/stats (API stats)
================================
    `);
});