const express = require('express');
const path = require('path');

const app = express();

// Log every request
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static('public'));

// Explicit root route
app.get('/', (req, res) => {
    console.log('Root route hit!');
    const filePath = path.join(__dirname, 'public', 'index.html');
    console.log('Trying to serve:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send('File not found: ' + err.message);
        }
    });
});

// Test route
app.get('/test', (req, res) => {
    res.send('Test route works!');
});

app.listen(3001, () => {
    console.log('Test server running on http://localhost:3001');
    console.log('Current directory:', __dirname);
    console.log('Public directory:', path.join(__dirname, 'public'));
});