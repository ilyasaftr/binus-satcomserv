require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 100;
const connectDB = require('./config/database');
const UpdateInstagramTarget = require('./cmd/addManualTarget');
const taskGetInstagramPost = require('./tasks/getInstagramPost');
const taskCheckInstagramPost = require('./tasks/checkInstagramPost');
const taskCreateInstagramPost = require('./tasks/createInstagramPost');
const instagramClient = require('./config/instagram');

async function main() {
  try {
    await connectDB();
    await UpdateInstagramTarget();
    // trying login to instagram
    try {
      const image_data = {
        image_path: './a.jpg',
        caption: 'Image caption',
      };
      await instagramClient.createSingleImage(image_data) || '';
    } catch (err) {
      // do nothing
    }

    taskGetInstagramPost();
    taskCheckInstagramPost();
    taskCreateInstagramPost();
  } catch (err) {
    console.log('Login to instagram failed, please check your cookies');
  }
}

main();
