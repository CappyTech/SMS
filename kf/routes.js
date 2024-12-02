const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const authService = require('../services/authService');
const fetch = require('./fetchKashFlowData');
const logger = require('../services/loggerService');

const router = express.Router();

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
    logger.info('WebSocket connection established.');
    ws.on('message', (message) => {
        logger.info(`Received message from client: ${message}`);
    });

    ws.on('close', () => {
        logger.info('WebSocket connection closed.');
    });
});

// Route for rendering the fetch status page
router.get('/kashflow', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    res.render(path.join('kashflow', 'fetchStatus'), {
        title: 'Gathering KashFlow Data',
    });
});

// Controller for initiating the data fetch process
router.get('/fetch-kashflow-data', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        logger.info('Starting KashFlow data fetch...');

        // Broadcast message function
        const broadcastMessage = (type, message) => {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type, message }));
                }
            });
        };

        // Fetch KashFlow data
        await fetch.fetchKashFlowData(broadcastMessage);

        broadcastMessage('success', 'Data fetch complete.');
        res.status(200).send('Fetch process initiated.');
    } catch (error) {
        logger.error('Error during data fetch:', error);
        res.status(500).send('An error occurred while initiating the fetch process.');
    }
});

// Upgrade HTTP connection to WebSocket
router.server = (server) => {
    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};

module.exports = router;
