require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 100;
const connectDB = require('./config/database');
const UpdateInstagramTarget = require('./cmd/addManualTarget');
const taskGetInstagramPost = require('./tasks/getInstagramPost');
const taskCheckInstagramPost = require('./tasks/checkInstagramPost');
const taskCreateInstagramPost = require('./tasks/createInstagramPost');

async function main() {
  try {
    await connectDB();
    await UpdateInstagramTarget();
    taskGetInstagramPost();
    taskCheckInstagramPost();
    // taskCreateInstagramPost();
  } catch (err) {
    console.log('Login to instagram failed, please check your cookies');
  }
}

main();
