/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'targets',
  },
);

targetSchema.statics.findByUsername = async function (username) {
  return this.findOne({ username });
};

targetSchema.statics.findByOldestUpdate = async function () {
  return this.findOne().sort({ updatedAt: 1 });
};

targetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Url = mongoose.model('Url', targetSchema);

module.exports = Url;
