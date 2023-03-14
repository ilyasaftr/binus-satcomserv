const mongoose = require('mongoose');
const { ocrSpace } = require('ocr-space-api-wrapper');
const fs = require('fs');
const path = require('path');
const instagramMediaSchema = require('../models/instagramMediaModel');
const instagramPostSchema = require('../models/instagramPostModel');
const gm = require('gm').subClass({imageMagick: true});

async function convertToSquare(imagePath) {
  return new Promise((resolve, reject) => {
    gm(imagePath)
      .size((err, size) => {
        if (err) {
          console.log(`[checkInstagramPost] ${path.basename(imagePath)}: terjadi kesalan`);
          reject(err);
        } else {
          const { width, height } = size;
          if (width === height) {
            console.log(`[checkInstagramPost] ${path.basename(imagePath)}: sudah 1:1`);
            resolve(imagePath); // tidak perlu diubah karena sudah 1:1
          } else {
            const maxDimension = Math.max(width, height);
            gm(imagePath)
              .gravity('Center')
              .resize(maxDimension, maxDimension, '^')
              .crop(maxDimension, maxDimension, 0, 0)
              .write(imagePath, (err) => {
                if (err) {
                  console.log(`[checkInstagramPost] ${path.basename(imagePath)}: terjadi kesalan`);
                  reject(err);
                } else {
                  console.log(`[checkInstagramPost] ${path.basename(imagePath)}: telah diubah menjadi 1:1`);
                  resolve(imagePath);
                }
              });
          }
        }
      });
  });
}

const addBorder = async (inputPath, outputPath, username) => {
  return new Promise((resolve, reject) => {
    gm(inputPath)
      .borderColor('black')
      .border(30, 30)
      .font('Helvetica.ttf', 22)
      .fill('white')
      .drawText(22, 22, `Reposted from @${username}`)
      .write(outputPath, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
  });
};

async function taskCheckInstagramPost() {
  try {
    // check if there is any instagram media in db
    const instagramMediaModel = mongoose.model('instagramMedias', instagramMediaSchema);
    const instagramMediaCount = await instagramMediaModel.countDocuments();
    if (instagramMediaCount === 0) {
      console.log('[checkInstagramPost] No instagram media found');
      return;
    }

    // get oldest one instagram media with status 0
    const instagramMedia = await instagramMediaModel.findOne({
      status: 0,
    }).sort({
      createdAt: 1,
    });

    if (!instagramMedia) {
      console.log('[checkInstagramPost] No instagram media to check found');
      return;
    }

    let instagramUsername = instagramMedia.instagramMediaUsername;
    let instagramMediaText = instagramMedia.instagramMediaText;
    let instagramMediaPath = instagramMedia.instagramMediaPath;

    // check by text
    let isSatFound = false;
    let isComservFound = false;
    let isCertificateFound = false;

    const satWords = ['SAT'];
    const satRegex = new RegExp("\\b" + satWords.join("\\b|\\b") + "\\b", "gi");
    if (instagramMediaText.toLocaleLowerCase().match(satRegex)) {
      isSatFound = true;
    }

    const comservWords = ['comserv', 'comservs', 'community service', 'community services', 'jamsos', 'jam sosial'];
    const comservRegex = new RegExp("\\b" + comservWords.join("\\b|\\b") + "\\b", "gi");
    if (instagramMediaText.toLocaleLowerCase().match(comservRegex)) {
      isComservFound = true;
    }

    const certificateWords = ['certificate', 'e-certificate', 'certificates', 'e-certificates', 'sertifikat'];
    const certificateRegex = new RegExp("\\b" + certificateWords.join("\\b|\\b") + "\\b", "gi");
    if (instagramMediaText.toLocaleLowerCase().match(certificateRegex)) {
      isCertificateFound = true;
    }

    // check by image
    const apiKeyArr = ['K89994701688957', 'K86228907788957', 'K86731363488957', 'K84717185988957', 'K82768161788957'];
    const randomIndex = Math.floor(Math.random() * apiKeyArr.length);
    const randomApiKey = apiKeyArr[randomIndex];

    const dirPath = path.join(process.cwd(), 'images');
    const fullPath = path.join(dirPath, instagramMediaPath);
    const ocrSpaceResponse = await ocrSpace(fullPath, { apiKey: randomApiKey, OCREngine: '5' });
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

    if (isSatFound || isComservFound) {
      const instagramPostModel = mongoose.model('instagramPosts', instagramPostSchema);
      let textCaption = `SAT : ${isSatFound ? '✅' : '❌'}\nComServ : ${isComservFound ? '✅' : '❌'}\nCertificate : ${isCertificateFound ? '✅' : '❌'}\n`;

      const regex = /https?:\/\/[^\s]*|www\.[^\s]*|[^\s]+\.[^\s]{2,}/gi;
      const links = instagramMediaText.match(regex);
      textCaption += 'Link(s) :\n';
      if (links != undefined) {
        if (links.length > 0) {
          for (const link of links) {
            // if link contains integer after dot or at then continue
            if (link.match(/\.\d+/) || link.includes('@') || link.includes(',') || link.includes('M.') || link.includes(')')) {
              continue;
            }

            textCaption += link + '\n';
          }
        }
      } else {
        textCaption += 'Please check the image!\n';
      }
      textCaption += '\n';
      textCaption += 'Event Details :\n';
      textCaption += instagramMediaText;
      textCaption = textCaption.replace('@', '[at]');
      let finaltextCaption = textCaption.substring(0, textCaption.length > 2000 ? 2000 : textCaption.length);
      // image validation
      await convertToSquare(fullPath);
      await addBorder(fullPath, fullPath, instagramUsername);
      const instagramPost = new instagramPostModel({
        instagramPostCaption: finaltextCaption,
        instagramMediaPath: instagramMediaPath,
        status: 0,
      });
      await instagramPost.save();
      instagramMedia.status = 1;
      await instagramMedia.save();
      return;
    }

    instagramMedia.status = 1;
    await instagramMedia.save();
    await fs.promises.unlink(fullPath);

    console.log('[checkInstagramPost] No SAT or ComServ found');
  } catch (err) {
    console.log('[checkInstagramPost] ', err);
  } finally {
    console.log('[checkInstagramPost] Waiting for 10 seconds...');
    setTimeout(taskCheckInstagramPost, 10 * 1000);
  }
}

module.exports = taskCheckInstagramPost;