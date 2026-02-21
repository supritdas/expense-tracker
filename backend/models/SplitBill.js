const mongoose = require('mongoose');

const splitBillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  amountPerPerson: { type: Number, required: true },
  createdBy: { type: String, required: true }, // The student who created the split
  date: { type: Date, default: Date.now },
  participants: [{
    regNo: String,
    name: String,
    paid: { type: Boolean, default: false },
    amount: Number
  }]
});

module.exports = mongoose.model('SplitBill', splitBillSchema);