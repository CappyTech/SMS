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

module.exports = {
    slimDateTime,
    formatCurrency,
};