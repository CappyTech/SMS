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

        const projectDir = path.join(projectsDir, Project.Number.toString());
        const files = fs.readdirSync(projectDir);

        res.render(path.join('kashflow', 'viewProject'), {
            title: 'Job Overview',
            Project,
            files,
        });
    } catch (error) {
        logger.error('Error reading kashflow Project:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

const serveFile = async (req, res, next) => {
    try {
        const Project = await db.KF_Projects.findByPk(req.params.uuid);

        if (!Project) {
            req.flash('error', 'Project not found.');
            return res.redirect('/dashboard/project');
        }

        const filePath = path.join(projectsDir, Project.Number.toString(), req.params.filename);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            req.flash('error', 'File not found.');
            res.redirect(`/kashflow/project/read/${req.params.uuid}`);
        }
    } catch (error) {
        logger.error('Error serving file:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const viewFile = async (req, res, next) => {
    try {
        const Project = await db.KF_Projects.findByPk(req.params.uuid);

        if (!Project) {
            req.flash('error', 'Project not found.');
            return res.redirect('/dashboard/project');
        }

        const filePath = path.join(projectsDir, Project.Number.toString(), req.params.filename);
        if (!fs.existsSync(filePath)) {
            req.flash('error', 'File not found.');
            return res.redirect(`/kashflow/project/read/${req.params.uuid}`);
        }

        const fileType = path.extname(filePath).toLowerCase();
        let type = 'unsupported';
        if (fileType.match(/\.(jpg|jpeg|png)$/)) {
            type = 'image';
        } else if (fileType === '.pdf') {
            type = 'pdf';
        }

        res.render(path.join('kashflow', 'viewFile'), {
            title: 'View File',
            file: req.params.filename,
            filePath: `/kashflow/project/${req.params.uuid}/serve/${req.params.filename}`,
            fileType: type,
            uuid: req.params.uuid,
        });
    } catch (error) {
        logger.error('Error viewing file:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

router.get('/project/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readProject);
router.get('/project/:uuid/serve/:filename', authService.ensureAuthenticated, authService.ensureRole('admin'), serveFile);
router.get('/project/:uuid/view/:filename', authService.ensureAuthenticated, authService.ensureRole('admin'), viewFile);


module.exports = router;