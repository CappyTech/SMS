const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const fs = require('fs');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const projectsDir = path.join(__dirname, '../../../Projects');
if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
    fs.chmodSync(projectsDir, 0o700); // Only owner can read/write/execute
}

const readProject = async (req, res, next) => {
    try {
        const Project = await db.KF_Projects.findByPk(req.params.uuid);

        if (!Project) {
            req.flash('error', 'Project not found.');
            return res.redirect('/dashboard/project');
        }

        const projectDir = path.join(projectsDir, Project.number.toString());
        const files = fs.readdirSync(projectDir);

        res.render(path.join('kashflow', 'viewProject'), {
            title: 'Project Overview',
            Project,
            files,
            number: Project.number
        });
    } catch (error) {
        logger.error('Error reading kashflow Project:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/project/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readProject);

module.exports = router;