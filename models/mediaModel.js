/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      unique: true,
    },
    mediaUsername: {
      type: String,
      required: true,
    },
    mediaCaption: {
      type: String,
      required: false,
    },
    mediaDate: {
      type: Date,
      required: true,
    },
    mediaStatus: {
      type: Number,
      required: true,
      default: 0,
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
    collection: 'medias',
  },
);

mediaSchema.statics.findByMediaId = async function (mediaId) {
  return this.findOne({ mediaId });
};

mediaSchema.statics.findByMediaStatus = async function (mediaStatus) {
  return this.findOne({ mediaStatus });
};

// find media with oldest createdAt and status = 0
mediaSchema.statics.findByOldestUpdate = async function () {
  return this.findOne({
    mediaStatus: 0,
  }).sort({ updatedAt: 1 });
};

mediaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
