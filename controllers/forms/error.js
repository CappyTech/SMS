const express = require('express');
const router = express.Router();
const path = require('path');

const e500 = async (req, res) => {
    try {
        res.render(path.join('errors', '500'), {
            title: '500',
            
            
            
        });
    } catch (error) {
        logger.error('Error rendering 500 page: ' + error.message);
        req.flash('error', 'Error rendering 500 page: ' + error.message);
        return res.redirect('/');
    }
};

const e404 = async (req, res) => {
    try {
        res.render(path.join('errors', '404'), {
            title: '404',
            
            
            
        });
    } catch (error) {
        logger.error('Error rendering 404 page: ' + error.message);
        req.flash('error', 'Error rendering 404 page: ' + error.message);
        return res.redirect('/');
    }
};

const e403 = async (req, res) => {
    try {
        res.render(path.join('errors', '403'), {
            title: '403',
            
            
            
        });
    } catch (error) {
        logger.error('Error rendering 403 page: ' + error.message);
        req.flash('error', 'Error rendering 403 page: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/500', e500);
router.get('/404', e404);
router.get('/403', e403);

module.exports = router;