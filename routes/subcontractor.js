// routes/subcontractor.js

const express = require('express');
const router = express.Router();
const {
    submitOnboardingForm,
    renderOnboardingForm,
} = require('../controllers/onboarding');

const {
    renderSubcontractorForm,
    submitSubcontractorForm,
} = require('../controllers/subcontractor');

router.get('/onboarding', renderOnboardingForm);
router.post('/onboarding', submitOnboardingForm);

router.get('/subcontractor/create', renderSubcontractorForm);
router.post('/subcontractor/create', submitSubcontractorForm);


module.exports = router;