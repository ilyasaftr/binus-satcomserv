const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const instagramPostSchema = require('../models/instagramPostModel');
const FormData = require('form-data');
const axios = require('axios');

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

  let instagramPostCaption = instagramPost.instagramPostCaption;
  instagramPostCaption = Buffer.from(instagramPostCaption, 'utf8').toString('base64');
  const instagramMediaPath = instagramPost.instagramMediaPath;
  const dirPath = path.join(process.cwd(), 'images');
  const fullPath = path.join(dirPath, instagramMediaPath);
  try {
    // create instagram post
    const formData = new FormData();
    formData.append('file', fs.createReadStream(fullPath));
    const axiosConfig = {
      method: 'post',
      url: `https://satcomserv.kodex.id/postMedia/?username=${process.env.INSTAGRAM_USERNAME}&password=${process.env.INSTAGRAM_PASSWORD}&caption=${instagramPostCaption}`,
      headers: {
        ...formData.getHeaders()
      },
      data : formData
    };

    const response = await axios(axiosConfig);
    if (response.status === 200) {
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
    await fs.promises.unlink(fullPath);
  } finally {
    console.log('[createInstagramPost] Waiting for 5 minute...');
    setTimeout(taskCreateInstagramPost, 5 * (60 * 1000));
  }
}

module.exports = taskCreateInstagramPost;