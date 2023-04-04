const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const instagramTargetSchema = require('../models/instagramTargetModel');
const instagramMediaSchema = require('../models/instagramMediaModel');

async function downloadImage(url, dest) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(dest));
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve();
      });
      response.data.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    console.error('[getInstagramPost] ', err);
  }
};

async function taskGetInstagramPost() {
  try {
    const instagramTargetModel = mongoose.model('instagramTargets', instagramTargetSchema);

    const instagramTargetCount = await instagramTargetModel.countDocuments();
    if (instagramTargetCount === 0) {
      console.log('[getInstagramPost] No instagram target found');
      return;
    }

    const instagramTarget = await instagramTargetModel.findOne({
      updatedAt: {
        $lte: new Date(Date.now() - 1 * (60 * (60 * 1000))),
      },
    }).sort({
      updatedAt: 1,
    });

    if (!instagramTarget) {
      console.log('[getInstagramPost] No instagram target to update found');
      return;
    }
    const axiosConfig = {
      method: 'post',
      url: `https://satcomserv.kodex.id/getMedias/?username=${process.env.INSTAGRAM_USERNAME}&password=${process.env.INSTAGRAM_PASSWORD}&target_username=${instagramTarget.username}`,
    };
    const response = await axios(axiosConfig);
    if (response.status !== 200) {
      console.log('[getInstagramPost] Failed to get instagram post');
      return;
    }
    const dataJSON = response.data;
    console.log(`[getInstagramPost] Updating ${instagramTarget.username} | ${dataJSON.length}`);
    const instagramMediaModel = mongoose.model('instagramMedias', instagramMediaSchema);
    for (const media of dataJSON) {
      let mediaId = media.pk;
      let mediaText = media.caption_text;
      let mediaTime = media.taken_at;
      // convert media time to date
      mediaTime = new Date(mediaTime);

      // continue if mediaTime 1 week ago
      const oneWeekAgo = new Date(Date.now() - 7 * (24 * 60 * 60 * 1000));
      if (mediaTime < oneWeekAgo) {
        console.log(`[getInstagramPost] Skip ${mediaId} because mediaTime is more than 1 week ago`);
        continue;
      }

      let mediaImage = media.thumbnail_url ? media.thumbnail_url : media.resources[0]?.thumbnail_url;
      // check if media already exist in db
      const instagramMediaCount = await instagramMediaModel.countDocuments({
        instagramMediaId: mediaId,
      });

      // check if mediaText already exist in db
      const instagramMediaTextCount = await instagramMediaModel.countDocuments({
        instagramMediaText: mediaText,
      });

      if (instagramMediaTextCount > 0) {
        console.log(`[getInstagramPost] ${mediaId} already exist in db`);
        continue;
      }

      if (instagramMediaCount === 0) {
        console.log(`[getInstagramPost] ${mediaId} added to db`);
        const fullFileName = `${mediaId}.jpg`;
        const dirPath = path.join(process.cwd(), 'images');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }

        const fullPath = path.join(dirPath, fullFileName);
        await downloadImage(mediaImage, fullPath);

        // create new media
        const instagramMedia = new instagramMediaModel({
          instagramMediaUsername: instagramTarget.username,
          instagramMediaId: mediaId,
          instagramMediaText: mediaText ? mediaText : 'No Text',
          instagramMediaTime: mediaTime,
          instagramMediaPath: fullFileName,
          status: 0,
        });

        await instagramMedia.save();
      }
    }

    // update instagram target
    instagramTarget.updatedAt = new Date();
    await instagramTarget.save();
  } catch (err) {
    console.log('[getInstagramPost] ', err);
  } finally {
    console.log('[getInstagramPost] Waiting for 5 minute...');
    setTimeout(taskGetInstagramPost, 5 * (60 * 1000));
  }
}

module.exports = taskGetInstagramPost;
