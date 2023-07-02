/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable eqeqeq */
const { ocrSpace } = require('ocr-space-api-wrapper');
const Media = require('../models/mediaModel');
const Post = require('../models/postModel');
const { checkDir, getDirPath, removeFile } = require('../utils/file');
const { sentryCapture } = require('../utils/sentry');
const { removeHashtags, convertToSquare, addBorder } = require('../utils/custom');

async function taskCheckMedia() {
  try {
    // get instagram media with mediaStatus = 0
    const mediaData = await Media.findByOldestUpdate();
    if (!mediaData) {
      console.log('[checkMedia] No media to check found');
      return;
    }

    console.log(`[checkMedia] Checking ${mediaData.mediaId} | ${mediaData.mediaUsername}`);

    const { mediaId } = mediaData;
    const { mediaUsername } = mediaData;
    const { mediaCaption } = mediaData;

    // check by text
    let isSatFound = false;
    let isComservFound = false;
    let isCertificateFound = false;

    const satWords = ['sat'];
    const satRegex = new RegExp(`\\b${satWords.join('\\b|\\b')}\\b`, 'gi');

    const comservWords = ['comserv', 'comservs', 'community service', 'community services', 'jamsos', 'jam sosial'];
    const comservRegex = new RegExp(`\\b${comservWords.join('\\b|\\b')}\\b`, 'gi');

    const certificateWords = ['certificate', 'e-certificate', 'certificates', 'e-certificates', 'sertifikat'];
    const certificateRegex = new RegExp(`\\b${certificateWords.join('\\b|\\b')}\\b`, 'gi');

    if (mediaCaption != null) {
      if (mediaCaption.toLocaleLowerCase().match(satRegex)) {
        isSatFound = true;
      }

      if (mediaCaption.toLocaleLowerCase().match(comservRegex)) {
        isComservFound = true;
      }

      if (mediaCaption.toLocaleLowerCase().match(certificateRegex)) {
        isCertificateFound = true;
      }
    }

    // check by image
    const apiKeyArr = ['K89994701688957', 'K86228907788957', 'K86731363488957', 'K84717185988957', 'K82768161788957'];
    const randomIndex = Math.floor(Math.random() * apiKeyArr.length);
    const randomApiKey = apiKeyArr[randomIndex];

    const dirPath = await getDirPath();
    const mediaFileName = `${mediaId}.jpg`;
    const mediaFilePath = `${dirPath.data.fullPath}/${mediaFileName}`;
    const isFileExist = await checkDir(mediaFilePath);
    if (isFileExist.status !== 'success') {
      console.log('[checkMedia] File not found');
      mediaData.mediaStatus = 2;
      await mediaData.save();
      return;
    }

    let ocrSpaceResponse = await ocrSpace(mediaFilePath, { apiKey: randomApiKey, OCREngine: '2' });
    if (ocrSpaceResponse.ParsedResults == null || ocrSpaceResponse.ParsedResults.length === 0) {
      ocrSpaceResponse = await ocrSpace(mediaFilePath, { apiKey: randomApiKey, OCREngine: '1' });
    }
    if (ocrSpaceResponse.ParsedResults == null || ocrSpaceResponse.ParsedResults.length === 0) {
      ocrSpaceResponse = await ocrSpace(mediaFilePath, { apiKey: randomApiKey, OCREngine: '3' });
    }

    const ocrText = ocrSpaceResponse.ParsedResults[0].ParsedText;

    if (ocrText.match(satRegex)) {
      isSatFound = true;
    }

    if (ocrText.match(comservRegex)) {
      isComservFound = true;
    }

    if (ocrText.match(certificateRegex)) {
      isCertificateFound = true;
    }

    // if isSatFound = false or isComservFound = false then return
    if (!isSatFound && !isComservFound) {
      console.log('[checkMedia] SAT or Comserv not found');
      mediaData.mediaStatus = 2;
      await mediaData.save();
      await removeFile(mediaFilePath);
      return;
    }

    let textCaption = `SAT : ${isSatFound ? '✅' : '❌'}\nComServ : ${isComservFound ? '✅' : '❌'}\nCertificate : ${isCertificateFound ? '✅' : '❌'}\n`;

    const regex = /https?:\/\/[^\s]*|www\.[^\s]*|[^\s]+\.[^\s]{2,}/gi;
    const urls = mediaCaption.match(regex);
    textCaption += 'Link(s) :\n';
    if (urls != undefined) {
      if (urls.length > 0) {
        for (const url of urls) {
          // if link contains integer after dot or at then continue
          if (url.match(/\.\d+/) || url.includes('@') || url.includes(',') || url.includes('M.') || url.includes(')')) {
            continue;
          }

          textCaption += `${url}\n`;
        }
      }
    } else {
      textCaption += 'Please check the image!\n';
    }
    textCaption += '\n';
    textCaption += 'Event Details :\n';
    textCaption += await removeHashtags(mediaCaption);
    textCaption = textCaption.replaceAll('#', '[hashtag]');
    textCaption = textCaption.replaceAll('@', '[at]');
    const finaltextCaption = textCaption.substring(0, textCaption.length > 2000 ? 2000 : textCaption.length);

    // image processing
    await convertToSquare(mediaFilePath);
    await addBorder(mediaFilePath, mediaFilePath, mediaUsername);

    // create post
    const newPost = new Post();
    newPost.mediaId = mediaId;
    newPost.postCaption = finaltextCaption;
    await newPost.save();

    // update mediaStatus = 1
    mediaData.mediaStatus = 1;
    await mediaData.save();

    console.log('[checkMedia] SAT or Comserv found');
  } catch (error) {
    console.log('[checkMedia] Error : ', error);
    sentryCapture(error);
  } finally {
    console.log('[checkMedia] Task finished');
    setTimeout(taskCheckMedia, 10 * 1000);
  }
}

module.exports = { taskCheckMedia };
