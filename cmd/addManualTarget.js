require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const instagramTargetSchema = require('../models/instagramTargetModel');

async function UpdateInstagramTarget() {
  const fullPath = path.join(process.cwd(), 'targetInstagram.txt');
  const data = await fs.promises.readFile(fullPath, 'utf8');
  const dataArr = data.split('\n');
  for(let i = 0; i < dataArr.length; i++) {
    const targetUsername = dataArr[i];
    const instagramTargetModel = mongoose.model('instagramTargets', instagramTargetSchema);

    // check if target already exists in db
    const checkUsername = await instagramTargetModel.findOne({
      username: targetUsername,
      updatedAt: {
        $gte: new Date(Date.now() - 60 * (60 * 1000)),
      },
    });

    if (checkUsername) {
      console.log(`[${i+1}/${dataArr.length}] ${targetUsername} already exists in database`);
      continue;
    }

    try {
      const instagramTarget = new instagramTargetModel();
      instagramTarget.username = targetUsername;
      // set updateAt 1 year ago
      instagramTarget.updatedAt = new Date(Date.now() - 60 * (60 * 1000) * 24 * 365);
      await instagramTarget.save();
      console.log(`[${i+1}/${dataArr.length}] ${targetUsername} added to database`);
    } catch (e) {
      console.log(e);
    }
  }
};

module.exports = UpdateInstagramTarget;