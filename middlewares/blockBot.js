const blockBot = (req, res, next) => {
    const blockedUserAgents = ['wpbot', 'bot'];
    const userAgent = req.headers['user-agent'].toLowerCase();
    if (blockedUserAgents.some(bot => userAgent.includes(bot))) {
        res.status(403).send('Access Forbidden');
    } else {
        next();
    }
};

module.exports = blockBot;