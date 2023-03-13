const mongoose = require('mongoose');

const instagramMediaSchema = new mongoose.Schema({
  instagramMediaUsername: {
    type: String,
    required: true,
  },
  instagramMediaId: {
    type: String,
    required: true,
  },
  instagramMediaText: {
    type: String,
    required: true,
  },
  instagramMediaTime: {
    type: Date,
    required: true,
  },
  instagramMediaPath: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'instagramMedias',
});

// eslint-disable-next-line func-names
instagramMediaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = instagramMediaSchema;
