const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  personalInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    state: String,
    city: String
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  educationStage: {
    type: String,
    enum: ['after10th', 'after12th', 'ongoing'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
