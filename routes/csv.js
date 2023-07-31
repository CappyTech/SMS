// routes/csv.js

const express = require('express');
const router = express.Router();
const csv = require('../controllers/csv.js');

// Render the CSV upload form
router.get('/upload', (req, res) => {
    res.render('uploadForm');
});

// Handle CSV file upload
router.post('/upload', (req, res) => {
    // Check if a file was uploaded
    if (!req.files || !req.files.csvFile) {
        req.flash('error', 'No CSV file uploaded.');
        return res.redirect('/upload');
    }

    // Move the uploaded CSV file to a temporary location on the server
    const csvFile = req.files.csvFile;
    const filePath = path.join(__dirname, '../temp', 'temp.csv');

    csvFile.mv(filePath, async (error) => {
        if (error) {
            console.error('Error saving CSV file:', error);
            req.flash('error', 'Error uploading CSV file.');
            return res.redirect('/upload');
        }

        // Import the data from the CSV file into the database
        try {
            await csv.importDataFromCSV(filePath);
            req.flash('success', 'CSV data imported successfully!');
            res.redirect('/');
        } catch (error) {
            console.error('Error importing CSV data:', error);
            req.flash('error', 'Error importing CSV data.');
            res.redirect('/upload');
        }
    });
});

// Endpoint to export data as CSV
router.get('/export', async (req, res) => {
    try {
        const csvData = await csv.exportDataToCSV();
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=invoices_${timestamp}.csv`);
        res.send(csvData);
    } catch (error) {
        console.error('Error exporting CSV data:', error);
        req.flash('error', 'Error exporting CSV data.');
        res.redirect('/');
    }
});

module.exports = router;