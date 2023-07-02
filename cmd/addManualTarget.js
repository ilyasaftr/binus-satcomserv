/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Target = require('../models/targetModel');
const { sentryCapture } = require('../utils/sentry');

async function UpdateInstagramTarget() {
  try {
    const fullPath = path.join(process.cwd(), 'targetInstagram.txt');
    const data = await fs.promises.readFile(fullPath, 'utf8');
    const dataArr = data.split('\n');
    console.log(`[UpdateInstagramTarget] ${dataArr.length} targets found`);
    for (let i = 0; i < dataArr.length; i++) {
      const targetUsername = dataArr[i];

      // check if target already exists in db
      const checkUsername = await Target.findByUsername(targetUsername);
      if (checkUsername) {
        console.log(`[${i + 1}/${dataArr.length}] ${targetUsername} already exists in database`);
        continue;
      }

      try {
        const newTarget = new Target();
        newTarget.username = targetUsername;
        // set updateAt 1 year ago
        newTarget.updatedAt = new Date(Date.now() - 60 * (60 * 1000) * 24 * 365);
        await newTarget.save();
        console.log(`[${i + 1}/${dataArr.length}] ${targetUsername} added to database`);
      } catch (e) {
        console.log(e);
      }
    }
    console.log('[UpdateInstagramTarget] Done');
  } catch (error) {
    console.log(`[addManualTarget] Error: ${error.message}`);
    sentryCapture(error);
  }
}

module.exports = UpdateInstagramTarget;
