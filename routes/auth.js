const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Register endpoint
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').trim().isLength({ min: 2 }),
    body('organizationName').optional().trim().isLength({ min: 2 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }

    const { email, password, fullName, organizationName } = req.body;
    
    try {
        const client = await req.app.locals.db.connect();
        
        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1', 
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            client.release();
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const userResult = await client.query(
            'INSERT INTO users (email, password_hash, full_name, role, status, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, role',
            [email, hashedPassword, fullName, 'user', 'active', true]
        );
        
        const user = userResult.rows[0];
        
        // Create organization if provided
        let organization = null;
        if (organizationName) {
            const slug = organizationName.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            const orgResult = await client.query(
                'INSERT INTO organizations (name, slug, owner_id, plan, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, slug, plan',
                [organizationName, slug, user.id, 'free', 'active']
            );
            
            organization = orgResult.rows[0];
            
            // Add user as organization owner
            await client.query(
                'INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, $3)',
                [user.id, organization.id, 'owner']
            );
        }
        
        client.release();
        
        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret-change-in-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            },
            organization
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }

    const { email, password } = req.body;
    
    try {
        const client = await req.app.locals.db.connect();
        
        // Find user
        const userResult = await client.query(
            'SELECT id, email, password_hash, full_name, role, status FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            client.release();
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = userResult.rows[0];
        
        if (user.status !== 'active') {
            client.release();
            return res.status(401).json({ error: 'Account is not active' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            client.release();
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await client.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Get user's organizations
        const orgsResult = await client.query(`
            SELECT o.id, o.name, o.slug, o.plan, om.role
            FROM organizations o
            JOIN organization_members om ON o.id = om.organization_id
            WHERE om.user_id = $1
        `, [user.id]);
        
        client.release();
        
        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'fallback-secret-change-in-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            },
            organizations: orgsResult.rows
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const client = await req.app.locals.db.connect();
        
        const userResult = await client.query(
            'SELECT id, email, full_name, role, status, created_at, last_login FROM users WHERE id = $1',
            [req.user.userId]
        );
        
        if (userResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Get user's organizations
        const orgsResult = await client.query(`
            SELECT o.id, o.name, o.slug, o.plan, o.status, om.role
            FROM organizations o
            JOIN organization_members om ON o.id = om.organization_id
            WHERE om.user_id = $1
        `, [user.id]);
        
        client.release();
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                status: user.status,
                createdAt: user.created_at,
                lastLogin: user.last_login
            },
            organizations: orgsResult.rows
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Logout endpoint (client-side token removal, server-side could implement token blacklist)
router.post('/logout', authenticateToken, (req, res) => {
    // In a production system, you might want to blacklist the token
    res.json({ message: 'Logout successful' });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;