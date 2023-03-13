const mongoose = require('mongoose');

const instagramPostSchema = new mongoose.Schema({
  instagramPostCaption: {
    type: String,
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
    default: null,
  },
}, {
  collection: 'instagramPosts',
});

// eslint-disable-next-line func-names
instagramPostSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = instagramPostSchema;
