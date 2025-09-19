const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Retell API configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_API_URL = 'https://api.retell.ai/v1';

// Create agent for user
router.post('/create-agent', authenticateToken, async (req, res) => {
    const { agentName, voiceId, prompt } = req.body;
    
    try {
        // Create agent in Retell
        const response = await fetch(`${RETELL_API_URL}/agents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: agentName,
                voice_id: voiceId,
                prompt: prompt
            })
        });
        
        const agent = await response.json();
        
        // Save to your database
        await pool.query(
            'INSERT INTO agents (user_id, retell_agent_id, name) VALUES ($1, $2, $3)',
            [req.user.userId, agent.id, agentName]
        );
        
        res.json(agent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;