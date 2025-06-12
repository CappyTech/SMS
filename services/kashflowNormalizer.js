
function normalizePayments(payments) {
  if (Array.isArray(payments)) return payments;

  if (Array.isArray(payments?.Payment?.Payment)) {
    return payments.Payment.Payment;
  } else if (payments?.Payment?.Payment) {
    return [payments.Payment.Payment];
  } else if (Array.isArray(payments?.Payment)) {
    return payments.Payment;
  } else if (payments?.Payment) {
    return [payments.Payment];
  }

  return [];
}

module.exports = {
  normalizePayments
};
