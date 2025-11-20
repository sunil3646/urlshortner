const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Strict Regex Validation per requirements: 6-8 alphanumeric characters
    match: [/^[A-Za-z0-9]{6,8}$/, 'Code must be 6-8 alphanumeric characters']
  },
  target: {
    type: String,
    required: [true, 'Target URL is required'],
    trim: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  lastClicked: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Link', LinkSchema);