const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');
const readProject = async (req, res, next) => {
    try {
        const Project = await db.KF_Projects.findByPk(req.params.uuid);

        if (!Project) {
            req.flash('error', 'Project not found.');
            return res.redirect('/dashboard/KFproject');
        }

        res.render(path.join('kashflow', 'viewProject'), {
            title: 'Project Overview',
            Project,
        });
    } catch (error) {
        logger.error('Error reading kashflow Project:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/kf/project/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readProject);

module.exports = router;