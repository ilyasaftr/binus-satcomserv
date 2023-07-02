/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      unique: true,
    },
    postCaption: {
      type: String,
      required: true,
    },
    postStatus: {
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
    collection: 'posts',
  },
);

postSchema.statics.findById = async function (id) {
  return this.findOne({ _id: id });
};

postSchema.statics.findByOldestUpdate = async function () {
  return this.findOne({
    postStatus: 0,
  }).sort({ updatedAt: 1 });
};

postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
