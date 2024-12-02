const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  InvoiceDBID: Number,
  InvoiceNumber: Number,
  InvoiceDate: Date,
  DueDate: Date,
  Customer: String,
  CustomerID: Number,
  Paid: Number,
  CustomerReference: String,
  EstimateCategory: String,
  SuppressTotal: Number,
  ProjectID: Number,
  CurrencyCode: String,
  ExchangeRate: Number,
  NetAmount: Number,
  VATAmount: Number,
  AmountPaid: Number,
  CustomerName: String,
  PermaLink: String,
  DeliveryAddress: {
    Name: String,
    Line1: String,
    Line2: String,
    Line3: String,
    Line4: String,
    PostCode: String,
    CountryName: String,
    CountryCode: String
  },
  UseCustomDeliveryAddress: Boolean,
  CISRCNetAmount: Number,
  CISRCVatAmount: Number,
  IsCISReverseCharge: Boolean
});

const Receipt = mongoose.model('Receipt', receiptSchema);
module.exports = Receipt;
