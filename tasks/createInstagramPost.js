const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const instagramClient = require('../config/instagram');
const instagramPostSchema = require('../models/instagramPostModel');

async function taskCreateInstagramPost() {
    // check if there is instagram post with status 0
    const instagramPostModel = mongoose.model('instagramPosts', instagramPostSchema);
    const instagramPostCount = await instagramPostModel.countDocuments({
      status: 0,
    });
    if (instagramPostCount === 0) {
      console.log('[createInstagramPost] No instagram post found');
      setTimeout(taskCreateInstagramPost, 60 * 1000);
      return;
    }

    // check if there is instagram post with status 1 have updatedAt 30 minutes ago
    // const checkLastPost = await instagramPostModel.findOne({
    //   status: 1,
    //   updatedAt: {
    //     $lte: new Date(Date.now() - 30 * (60 * 1000)),
    //   },
    // }).sort({
    //   updatedAt: 1,
    // });

    // if (checkLastPost) {
    //   console.log('[createInstagramPost] No instagram post to create found');
    //   setTimeout(taskCreateInstagramPost, 60 * 1000);
    //   return;
    // }

    // get oldest one instagram post with status 0
    const instagramPost = await instagramPostModel.findOne({
      status: 0,
    }).sort({
      createdAt: 1,
    });

  const instagramPostCaption = instagramPost.instagramPostCaption;
  const instagramMediaPath = instagramPost.instagramMediaPath;
  const dirPath = path.join(process.cwd(), 'images');
  const fullPath = path.join(dirPath, instagramMediaPath);
  try {
    // create instagram post
    const image_data = {
      image_path: fullPath,
      caption: instagramPostCaption,
    };
    const created = await instagramClient.createSingleImage(image_data);
    if (created) {
      console.log('[createInstagramPost] Instagram post created');
      instagramPost.status = 1;
      instagramPost.updatedAt = Date.now();
      await instagramPost.save();
      await fs.promises.unlink(fullPath);
    } else {
      console.log('[createInstagramPost] Instagram post not created');
    }
  } catch (err) {
    console.log('[createInstagramPost] ' + err);
    instagramPost.status = 2;
    instagramPost.updatedAt = Date.now();
    await instagramPost.save();
    // await fs.promises.unlink(fullPath);
  } finally {
    console.log('[createInstagramPost] Waiting for 1 minute...');
    setTimeout(taskCreateInstagramPost, 60 * 1000);
  }
}

module.exports = taskCreateInstagramPost;