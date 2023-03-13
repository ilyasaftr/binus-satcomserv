require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const connectDB = require('../config/database');
const instagramTargetSchema = require('../models/instagramTargetModel');

async function addManual() {
  try {
    await connectDB();
    console.log('Application started successfully!');
  } catch (err) {
    console.error(err);
  }

  const data = await fs.promises.readFile('./targetInstagram.txt', 'utf8');
  const dataArr = data.split('\n');
  for(let i = 0; i < dataArr.length; i++) {
    const targetUsername = dataArr[i];
    const instagramTargetModel = mongoose.model('instagramTargets', instagramTargetSchema);

    // check if target already exists in db
    const checkUsername = await instagramTargetModel.findOne({
      username: targetUsername,
    });

    if (checkUsername) {
      console.log(`[${i+1}/${dataArr.length}] ${targetUsername} already exists in database`);
      continue;
    }

    try {
      const instagramTarget = new instagramTargetModel();
      instagramTarget.username = targetUsername;
      await instagramTarget.save();
      console.log(`[${i+1}/${dataArr.length}] ${targetUsername} added to database`);
    } catch (e) {
      console.log(e);
    }
  }

  mongoose.connection.close();
  process.exit(0);
};

addManual();