function normalizePayments(payments) {
  // Already normalized (array of payment objects)
  if (Array.isArray(payments) && payments.every(p => typeof p === 'object' && 'PayAmount' in p)) {
    return payments;
  }

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