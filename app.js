require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 100;
const fs = require('fs');
const path = require('path');
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
      const cookiesPath = path.join(process.cwd(), 'cookies.json');
      const newCookies = JSON.stringify(`[{"key":"csrftoken","value":"KnZySYs4CWDuqS3qNo2ZtTi3Fumlum98","expires":"2021-03-12T03:00:51.000Z","maxAge":31449600,"domain":"instagram.com","path":"/","secure":true,"creation":"2021-03-14T03:00:51.784Z"},{"key":"rur","value":"\"PRN\\05458490296091\\0541710298851:01f72bf754e40140b470c65405b71b0fb1a3df5d7aa92b03e22f02bd49c9795e864451d5\"","domain":"instagram.com","path":"/","secure":true,"httpOnly":true,"creation":"2021-03-14T03:00:51.785Z","sameSite":"lax"},{"key":"mid","value":"ZA_jYAAAAAElOoXyTL8ubxCghmhi","expires":"2021-03-13T03:00:51.000Z","maxAge":63072000,"domain":"instagram.com","path":"/","secure":true,"creation":"2021-03-14T03:00:51.785Z"},{"key":"ds_user_id","value":"58490296091","expires":"2021-06-12T03:00:51.000Z","maxAge":7776000,"domain":"instagram.com","path":"/","secure":true,"creation":"2021-03-14T03:00:51.785Z"},{"key":"ig_did","value":"2A51460C-7F0C-4E2A-B4FE-40FDBD89FD24","expires":"2021-03-13T03:00:51.000Z","maxAge":63072000,"domain":"instagram.com","path":"/","secure":true,"httpOnly":true,"creation":"2021-03-14T03:00:51.786Z"},{"key":"sessionid","value":"58490296091%3A2fX3lmFGuD5C2Z%3A3%3AAYcLj5XCthVfly3xrEmXu6BLbaAnyxl34wLTqnhGHg","expires":"2021-03-13T03:00:51.000Z","maxAge":31536000,"domain":"instagram.com","path":"/","secure":true,"httpOnly":true,"creation":"2021-03-14T03:00:51.786Z"},{"key":"ig_cb","value":"1","creation":"2021-03-14T03:00:51.786Z"}]`);
      await fs.promises.writeFile(cookiesPath, newCookies, 'utf8');
      console.log('Login to instagram failed, please check your cookies');
      console.log(err);
      // do nothing
    }

    taskGetInstagramPost();
    taskCheckInstagramPost();
    taskCreateInstagramPost();
  } catch (err) {
    console.error(err);
  }
}

main();
