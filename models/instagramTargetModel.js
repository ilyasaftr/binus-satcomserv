const mongoose = require('mongoose');

const instagramTargetSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
}, {
  collection: 'instagramTargets',
});

// eslint-disable-next-line func-names
instagramTargetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = instagramTargetSchema;
