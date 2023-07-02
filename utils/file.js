const fs = require('fs');
const path = require('path');
const { sentryCapture } = require('./sentry');

async function checkDir(dirPath) {
  try {
    await fs.promises.access(dirPath);
    return {
      status: 'success',
      message: 'Success Check Dir',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Not Found',
    };
  }
}

async function createDir(dirPath) {
  try {
    const response = await checkDir(dirPath);
    if (response.status !== 200) {
      await fs.promises.mkdir(dirPath);
    }

    return {
      status: 'success',
      message: 'Success Create Dir',
    };
  } catch (error) {
    if (error.code === 'EEXIST') {
      return {
        status: 'success',
        message: 'Directory already exists',
      };
    }
    sentryCapture(error);
    return {
      status: 'error',
      message: error.message || 'Internal Server Error',
    };
  }
}

async function getDirPath(name = 'medias') {
  try {
    const fullPath = path.join(process.cwd(), name);
    await createDir(fullPath);
    return {
      status: 'success',
      message: 'Success Create or Check Dir',
      data: {
        fullPath,
      },
    };
  } catch (error) {
    sentryCapture(error);
    return {
      status: 'error',
      message: error.message || 'Internal Server Error',
    };
  }
}

async function saveFile(fileName, tempImageData, isBase64 = true) {
  try {
    const mode = isBase64 ? 'base64' : 'binary';
    const imageData = Buffer.from(tempImageData, mode);
    const fullPath = await getDirPath();
    const fullPathFile = `${fullPath.data.fullPath}/${fileName}`;
    await fs.promises.writeFile(`${fullPathFile}`, imageData);
    return {
      status: 'success',
      message: 'Success Save File',
      data: {
        fileName,
        fullPathFile,
      },
    };
  } catch (error) {
    sentryCapture(error);
    return {
      status: 'error',
      message: error.message || 'Internal Server Error',
    };
  }
}

async function removeFile(fullPath) {
  try {
    await fs.promises.unlink(fullPath);
    return {
      status: 'success',
      message: 'Success Remove File',
    };
  } catch (error) {
    sentryCapture(error);
    return {
      status: 'error',
      message: error.message || 'Internal Server Error',
    };
  }
}

module.exports = {
  checkDir,
  createDir,
  saveFile,
  removeFile,
  getDirPath,
};
