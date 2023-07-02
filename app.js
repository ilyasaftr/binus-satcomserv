require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 100;
const { sentryInit } = require('./utils/sentry');
const connectDB = require('./config/database');
const UpdateInstagramTarget = require('./cmd/addManualTarget');
const { taskGetMedia } = require('./tasks/getMedia');
const { taskCheckMedia } = require('./tasks/checkMedia');
const { taskCreatePost } = require('./tasks/createPost');

async function main() {
  try {
    sentryInit();
    await connectDB();
    await UpdateInstagramTarget();
    await taskGetMedia();
    await taskCheckMedia();
    await taskCreatePost();
  } catch (error) {
    console.log(error);
  }
}

main();
