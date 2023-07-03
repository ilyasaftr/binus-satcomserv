/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
const dayjs = require('dayjs');
const Target = require('../models/targetModel');
const Media = require('../models/mediaModel');
const InstagramAPI = require('../utils/InstagramAPI');
const { sentryCapture } = require('../utils/sentry');
const { instagramMediaJSONParser } = require('../utils/json');
const { saveFile } = require('../utils/file');

async function taskGetMedia() {
  try {
    const targetUsername = await Target.findByOldestUpdate();
    if (!targetUsername) {
      console.log('[getMedia] No target to update found');
      return;
    }
    console.log(`[getMedia] Updating ${targetUsername.username}`);
    const instagramAPI = new InstagramAPI();
    const response = await instagramAPI.getMediaByUsername(targetUsername.username);

    // process response data
    const instagramMediaJSONData = await instagramMediaJSONParser(response.data);
    for (const media of instagramMediaJSONData) {
      const mediaId = media.id;
      const mediaText = media.text;
      const mediaTime = media.time;
      const mediaImage = media.image;

      // continue if mediaTime 1 week ago
      const currentDate = dayjs();
      const formatTime = dayjs.unix(Number(mediaTime));
      const diffDays = dayjs(currentDate).diff(formatTime, 'day');
      if (diffDays > 4) {
        console.log(`[getMedia] Skip ${mediaId} because mediaTime is more than 4 week ago | ${diffDays} days ago`);
        continue;
      }

      // check if media already exist in db
      const mediaCount = await Media.findByMediaId(mediaId);
      if (mediaCount) {
        console.log(`[getMedia] Skip ${mediaId} because media already exist`);
        continue;
      }

      // save media image
      const mediaFileName = `${mediaId}.jpg`;
      const responseFile = await saveFile(mediaFileName, mediaImage);
      if (responseFile.status !== 'success') {
        console.log(`[getMedia] Failed to save ${mediaId} | ${mediaFileName}`);
        console.log(mediaImage);
        continue;
      }
      console.log(`[getMedia] Saved ${mediaId} | ${mediaFileName}`);

      const newMedia = new Media();
      newMedia.mediaUsername = targetUsername.username;
      newMedia.mediaId = mediaId;
      newMedia.mediaCaption = mediaText;
      newMedia.mediaDate = formatTime;
      await newMedia.save();
    }

    targetUsername.updatedAt = new Date();
    await targetUsername.save();
  } catch (error) {
    console.log(`[getMedia] Error: ${error.message}`);
    sentryCapture(error);
  } finally {
    console.log('[getMedia] Task finished');
    setTimeout(taskGetMedia, 5 * (60 * 1000));
  }
}

module.exports = { taskGetMedia };
