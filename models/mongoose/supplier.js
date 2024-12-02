const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  SupplierID: Number,
  Code: String,
  Name: String,
  Contact: String,
  Mobile: String,
  Fax: String,
  Address1: String,
  Address2: String,
  Address3: String,
  Address4: String,
  PostCode: String,
  Telephone: String,
  Website: String,
  Email: String,
  Created: Date,
  Updated: Date,
  EC: Number,
  VATNumber: String,
  Notes: String,
  CurrencyID: Number,
  PaymentTerms: Number,
  ContactTitle: String,
  ContactFirstName: String,
  ContactLastName: String,
  TradeBorderType: Number
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
