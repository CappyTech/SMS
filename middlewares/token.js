const Token = require('./models/Token');

async function actionMiddleware(req, res, next) {
    const token = req.params.token;

    // Find the token, excluding soft-deleted ones
    const tokenData = await Token.findOne({ where: { token } });

    if (tokenData) {
        const now = new Date();
        const tokenAge = (now - tokenData.createdAt) / 1000; // Age in seconds

        if (
            tokenData.valid &&
            !tokenData.actionCompleted &&
            tokenData.action === 'createForm' && // Ensure action matches
            tokenAge <= 300 // Token is valid for 5 minutes
        ) {
            req.tokenData = tokenData; // Pass token data to the next handler
            return next();
        }
    }

    // Token is invalid, expired, or not found
    res.status(403).send('Invalid or expired token');
}

module.exports = {
    actionMiddleware
}