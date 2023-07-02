/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
const gm = require('gm').subClass({ imageMagick: true });
const path = require('path');

async function removeHashtags(str) {
  const regex = /#\w+\b/g; // regular expression to match all hashtags
  const hashtags = str.match(regex); // get all hashtags in the string

  if (!hashtags) {
    return str; // no hashtags found, return the original string
  }

  for (let i = 0; i < hashtags.length; i++) {
    const hashtag = hashtags[i];
    str = str.replace(hashtag, ''); // remove hashtag from the string
  }

  return str; // return the modified string
}

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
              .write(imagePath, (err2) => {
                if (err2) {
                  console.log(`[checkInstagramPost] ${path.basename(imagePath)}: terjadi kesalan`);
                  reject(err2);
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

const addBorder = async (inputPath, outputPath, username) => new Promise((resolve, reject) => {
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

module.exports = {
  removeHashtags,
  convertToSquare,
  addBorder,
};
