const express = require('express');
const fs = require('fs');
const path = require('path');
const authService = require('../services/authService');
const router = express.Router();

const renderIndex = (req, res) => {
    res.render('index', {
        title: 'Home',
    });
};

router.get('/', renderIndex);

router.get('/app.log', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    const logPath = path.join(__dirname, 'app.log'); // adjust path as needed

    // Optionally check file exists
    if (!fs.existsSync(logPath)) {
        return res.status(404).send('Log file not found');
    }

    res.setHeader('Content-Type', 'text/plain');

    const stream = fs.createReadStream(logPath, { encoding: 'utf8' });

    stream.on('error', (err) => {
        console.error('Failed to read log:', err);
        res.status(500).send('Error reading log file.');
    });

    stream.pipe(res);
});

module.exports = router;
