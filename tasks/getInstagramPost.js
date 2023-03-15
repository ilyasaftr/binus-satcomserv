const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const instagramClient = require('../config/instagram');
const instagramTargetSchema = require('../models/instagramTargetModel');
const instagramMediaSchema = require('../models/instagramMediaModel');
const { getInstagramMediaByUsername } = require('../utils/instagramMediaLib');

async function taskGetInstagramPost() {
  try {
    const instagramTargetModel = mongoose.model('instagramTargets', instagramTargetSchema);

    // check if there is any instagram target in db
    const instagramTargetCount = await instagramTargetModel.countDocuments();
    if (instagramTargetCount === 0) {
      console.log('[getInstagramPost] No instagram target found');
      return;
    }

    // get one instagram target from db with oldest updatedAt and updatedAt must be more than 60 minutes ago or longer
    const instagramTarget = await instagramTargetModel.findOne({
      updatedAt: {
        $lte: new Date(Date.now() - 60 * (60 * 1000)),
      },
    }).sort({
      updatedAt: 1,
    });

    if (!instagramTarget) {
      console.log('[getInstagramPost] No instagram target to update found');
      return;
    }

    const cookiesPath = path.join(process.cwd(), 'cookies.json');
    const json = await fs.promises.readFile(cookiesPath, 'utf8');
    const cookiesData = JSON.parse(json);
    let _cookie =  '';
    for(data of cookiesData){
        _cookie += `${data['key']}=${data['value']}; `;
    }
    const _userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'      // <!-- required!! please get your user-agent from your browser console (7)
    const _xIgAppId = '936619743392459'

    console.log(`[getInstagramPost] ${cookiesPath} | ${_cookie}`);

    const responseMedia = await getInstagramMediaByUsername({
      headers: {
          'cookie': _cookie,
          'user-agent': _userAgent,
          'x-ig-app-id': _xIgAppId
      },
      time: 0,
      base64images: true,
      maxImages: 12,
      id: instagramTarget.username
    })

    if (responseMedia.length == 0) {
      console.log(`[getInstagramPost] No media found for ${instagramTarget.username} or cookies expired`);
      console.log('[getInstagramPost] Getting new cookies...');
      // set cookies expired
      // replace cookies.json with new cookies
      // get new cookies
      // save new cookies as cookies.json use JSON parse and stringify

      const cookiesPath = path.join(process.cwd(), 'cookies.json');
      if(fs.existsSync(cookiesPath)) {
        await fs.promises.unlink(cookiesPath);
      }

      // trying login to instagram
      try {
        const image_data = {
          image_path: './a.jpg',
          caption: 'Image caption',
        };
        await instagramClient.createSingleImage(image_data) || '';
      } catch (err) {
        console.log('[getInstagramPost] Error while trying to login to instagram');
        console.log(err);
        // do nothing
      }
      return;
    }

    console.log(`[getInstagramPost] Updating ${instagramTarget.username} | ${responseMedia.length}`);
    const instagramMediaModel = mongoose.model('instagramMedias', instagramMediaSchema);
    for (const media of responseMedia) {
      let mediaId = media.id;
      let mediaText = media.text;
      let mediaTime = media.time;
      // convert media time to date
      mediaTime = new Date(mediaTime * 1000);

      // continue if mediaTime 1 week ago
      const oneWeekAgo = new Date(Date.now() - 7 * (24 * 60 * 60 * 1000));
      if (mediaTime < oneWeekAgo) {
        console.log(`[getInstagramPost] Skip ${mediaId} because mediaTime is more than 1 week ago`);
        continue;
      }

      let mediaImage = media.image;
      // check if media already exist in db
      const instagramMediaCount = await instagramMediaModel.countDocuments({
        instagramMediaId: mediaId,
      });

      if (instagramMediaCount === 0) {
        console.log(`[getInstagramPost] ${mediaId} added to db`);
        const fullFileName = `${mediaId}.jpg`;
        const dirPath = path.join(process.cwd(), 'images');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }

        const fullPath = path.join(dirPath, fullFileName);
        const buffer = Buffer.from(mediaImage, "base64");
        await fs.promises.writeFile(fullPath, buffer);

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
    console.log('[getInstagramPost] Waiting for 1 minute...');
    setTimeout(taskGetInstagramPost, 60 * 1000);
  }
}

module.exports = taskGetInstagramPost;