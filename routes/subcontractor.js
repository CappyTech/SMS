// routes/subcontractor.js

const express = require('express');
const router = express.Router();
const {
    submitOnboardingForm,
    renderOnboardingForm
} = require('../controllers/account');

router.get('/onboarding', renderOnboardingForm);
router.post('/onboarding', submitOnboardingForm);

module.exports = router;