require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

/* --------------------------- Middleware --------------------------- */
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------ Serve static files + Root route -> public/index.html ------ */
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ------------------------------ Health ---------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Realtalk AI Backend is healthy!',
  });
});

/* --------------------------- Dashboard API ------------------------ */
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    users: 2453,
    revenue: 48275,
    orders: 846,
    projects: 142,
    userChange: 12,
    revenueChange: 23,
    orderChange: -5,
    projectChange: 8,
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
      icon: '👤',
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received',
      description: 'Invoice #1847 has been paid',
      time: '1h ago',
      icon: '✅',
    },
    {
      id: 3,
      type: 'alert',
      title: 'Server warning',
      description: 'CPU usage exceeded 80%',
      time: '3h ago',
      icon: '⚠️',
    },
    {
      id: 4,
      type: 'comment',
      title: 'New comment',
      description: 'Mike posted on Project Alpha',
      time: '5h ago',
      icon: '💬',
    },
  ]);
});

app.get('/api/dashboard/chart', (req, res) => {
  res.json({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    values: [8500, 10200, 7800, 12400, 9600, 13100, 8900],
  });
});

app.get('/api/dashboard/customers', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Alice Smith',
      email: 'alice@example.com',
      status: 'active',
      revenue: 3428,
      created: 'Jan 12, 2025',
    },
    {
      id: 2,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      status: 'pending',
      revenue: 1892,
      created: 'Jan 10, 2025',
    },
  ]);
});

/* --------------------------- Retell Route ------------------------- */
// Add this line with your other routes
app.use('/api/retell', require('./routes/retell'));

/* ----------------------- 404 + Error Handling --------------------- */
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.path}`,
    error: 'Not Found',
    statusCode: 404,
  });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/* ----------------------------- Start ------------------------------ */
app.listen(PORT, () => {
  console.log(`
🚀 Server running at: http://localhost:${PORT}
📊 Dashboard:        http://localhost:${PORT}
🏥 Health:           http://localhost:${PORT}/health
📈 Stats API:        http://localhost:${PORT}/api/dashboard/stats
🔁 Retell API:       http://localhost:${PORT}/api/retell
  `);
});

module.exports = app;
