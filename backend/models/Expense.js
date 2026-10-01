const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Lương', 'Điện nước', 'Vật tư', 'Marketing', 'Bảo trì', 'Khác'],
    default: 'Khác'
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Expense', expenseSchema);
