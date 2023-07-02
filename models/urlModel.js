/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    urlData: {
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
    collection: 'urls',
  },
);

urlSchema.statics.findByURL = async function (url) {
  return this.findOne({ urlData: url });
};

urlSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
