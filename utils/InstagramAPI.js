/* eslint-disable quote-props */
const shell = require('shelljs');
const fs = require('fs');
const { CurlGenerator } = require('curl-generator');
const { sentryCapture } = require('./sentry');
const { base64Decode } = require('./custom');

class InstagramAPI {
  constructor() {
    this.configData = {
      curl_impersonate: process.env.INTERNAL_CURL_IMPERSONATE_BIN,
      headers: {
        'x-instagram-ajax': process.env.INSTAGRAM_AJAX,
        'x-asbd-id': process.env.INSTAGRAM_ASBD,
        'x-csrftoken': process.env.INSTAGRAM_CSRF,
        'x-ig-app-id': process.env.INSTAGRAM_APP_ID,
        'x-ig-www-claim': base64Decode(process.env.INSTAGRAM_WWW_CLAIM),
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': base64Decode(process.env.INSTAGRAM_COOKIE),
        'origin': 'https://www.instagram.com',
        'referer': 'https://www.instagram.com/',
      },
    };
  }

  async getMediaByUsername(targetUsername) {
    try {
      const url = encodeURI(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${targetUsername}`);
      const method = 'GET';
      const curlConfig = {
        url,
        method,
        headers: {
          ...this.configData.headers,
        },
      };
      const generateCommand = CurlGenerator(curlConfig, { silent: true, compressed: true });
      const command = generateCommand.replace('curl', `${this.configData.curl_impersonate} -sS`);
      const response = shell.exec(`${command}`, { async: false, silent: true }).stdout;

      let responseJSON = null;
      try {
        responseJSON = JSON.parse(response);
      } catch (error) {
        console.log(`[InstagramAPI-getMediaByUsername] Failed to parse response to JSON: ${error.message}`);
        sentryCapture(error, response);
        return {
          status: 'error',
          message: `Failed to parse response to JSON: ${error.message}`,
        };
      }

      if (responseJSON.status !== 'ok') {
        console.log(`[InstagramAPI-getMediaByUsername] Failed to get media by username: ${responseJSON.message}`);
        return {
          status: 'error',
          message: 'Failed to get media by username',
        };
      }

      return {
        status: 'success',
        data: responseJSON,
      };
    } catch (error) {
      console.log(`[InstagramAPI-getMediaByUsername] Failed to get media by username: ${error.message}`);
      sentryCapture(error);
      return {
        status: 'error',
        message: 'Failed to get media by username',
      };
    }
  }

  async uploadMedia(mediaPath) {
    try {
      const file = await fs.promises.readFile(mediaPath);
      const uploadId = Math.floor(Date.now() / 1000);
      const ruploadParams = {
        media_type: 1,
        upload_id: uploadId.toString(),
        upload_media_height: 1080,
        upload_media_width: 1080,
      };

      const url = encodeURI(`https://i.instagram.com/rupload_igphoto/fb_uploader_${uploadId}`);
      const method = 'POST';
      const curlConfig = {
        url,
        method,
        headers: {
          'x-entity-type': 'image/jpeg',
          'x-entity-name': `fb_uploader_${uploadId}`,
          'x-instagram-rupload-params': JSON.stringify(ruploadParams),
          'x-entity-length': `${file.byteLength}`,
          'offset': '0',
          'content-type': 'image/jpeg',
          ...this.configData.headers,
        },
      };

      const generateCommand = CurlGenerator(curlConfig, { silent: true, compressed: true });
      let command = generateCommand.replace('curl', `${this.configData.curl_impersonate} -sS`);
      command += ` --data-binary @${mediaPath}`;
      const response = shell.exec(`${command}`, { async: false, silent: true }).stdout;
      let responseJSON = null;
      try {
        responseJSON = JSON.parse(response);
      } catch (error) {
        console.log(`[InstagramAPI-uploadMedia] Failed to parse response to JSON: ${error.message}`);
        sentryCapture(error, response);
        return {
          status: 'error',
          message: `Failed to parse response to JSON: ${error.message}`,
        };
      }

      if (responseJSON.status !== 'ok') {
        console.log(`[InstagramAPI-uploadMedia] Failed to upload media: ${responseJSON.message}`);
        return {
          status: 'error',
          message: 'Failed to upload media',
        };
      }

      return {
        status: 'success',
        data: responseJSON,
      };
    } catch (error) {
      console.log(`[InstagramAPI-uploadMedia] Failed to upload media : ${error.message}`);
      sentryCapture(error);
      return {
        status: 'error',
        message: 'Failed to get media by username',
      };
    }
  }

  async configureMedia(uploadId, caption) {
    try {
      const formData = encodeURI(`source_type=library&caption=${caption}&upload_id=${uploadId}&custom_accessibility_caption=${caption}&disable_comments=0&like_and_view_counts_disabled=0&igtv_share_preview_to_feed=1&is_unified_video=1&video_subtitles_enabled=0&disable_oa_reuse=false`);
      const url = encodeURI('https://i.instagram.com/api/v1/media/configure/');
      const method = 'POST';
      const curlConfig = {
        url,
        method,
        headers: {
          ...this.configData.headers,
        },
        body: formData,
      };

      const generateCommand = CurlGenerator(curlConfig, { silent: true, compressed: true });
      const command = generateCommand.replace('curl', `${this.configData.curl_impersonate} -sS`);
      const response = shell.exec(`${command}`, { async: false, silent: true }).stdout;
      let responseJSON = null;
      try {
        responseJSON = JSON.parse(response);
      } catch (error) {
        console.log(`[InstagramAPI-configureMedia] Failed to parse response to JSON: ${error.message}`);
        sentryCapture(error, response);
        return {
          status: 'error',
          message: `Failed to parse response to JSON: ${error.message}`,
        };
      }

      if (responseJSON.status !== 'ok') {
        console.log(`[InstagramAPI-configureMedia] Failed to configure media #1 : ${responseJSON.message}`);
        return {
          status: 'error',
          message: 'Failed to configure media',
        };
      }

      return {
        status: 'success',
        data: responseJSON,
      };
    } catch (error) {
      console.log(`[InstagramAPI-configureMedia] Failed to configure media #2 : ${error.message}`);
      sentryCapture(error);
      return {
        status: 'error',
        message: 'Failed to configure media',
      };
    }
  }
}

module.exports = InstagramAPI;
