// helpers.js

function slimDateTime(dateString) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    return formattedDate.replace(/\//g, '/');
}

function formatCurrency(amount) {
    // Check if the amount is a number
    if (typeof amount !== 'number') {
        throw new Error('Invalid input. Amount must be a number.');
    }

    // Format the amount with two decimal places and add £ symbol
    const formattedAmount = '£' + amount.toFixed(2);

    return formattedAmount;
}

const isAdmin = (req, res, next) => {
    if (req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }
    next();
  };

module.exports = {
    slimDateTime,
    formatCurrency,
    isAdmin
};