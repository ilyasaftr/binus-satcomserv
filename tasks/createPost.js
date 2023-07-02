const Post = require('../models/postModel');
const InstagramAPI = require('../utils/InstagramAPI');
const { sentryCapture } = require('../utils/sentry');
const { checkDir, getDirPath, removeFile } = require('../utils/file');

async function taskCreatePost() {
  try {
    const postData = await Post.findByOldestUpdate();
    if (!postData) {
      console.log('[createPost] No post to create found');
      return;
    }

    const postMediaId = postData.mediaId;
    const { postCaption } = postData;

    const dirPath = await getDirPath();
    const mediaFileName = `${postMediaId}.jpg`;
    const mediaFilePath = `${dirPath.data.fullPath}/${mediaFileName}`;
    const isFileExist = await checkDir(mediaFilePath);
    if (isFileExist.status !== 'success') {
      console.log('[createPost] File not found');
      postData.postStatus = 2;
      await postData.save();
      return;
    }

    const instagramAPI = new InstagramAPI();
    const uploadMediaResponse = await instagramAPI.uploadMedia(mediaFilePath);
    if (uploadMediaResponse.status !== 'success') {
      console.log('[createPost] Failed to upload media');
      postData.postStatus = 2;
      await postData.save();
      await removeFile(mediaFilePath);
      return;
    }

    console.log('[createPost] Media uploaded');
    const uploadId = uploadMediaResponse.data.upload_id;
    const createPostResponse = await instagramAPI.configureMedia(uploadId, postCaption);
    if (createPostResponse.status !== 'success') {
      console.log('[createPost] Failed to create post');
      postData.postStatus = 2;
      await postData.save();
      await removeFile(mediaFilePath);
      return;
    }

    console.log('[createPost] Post created');
    postData.postStatus = 1;
    await postData.save();
    await removeFile(mediaFilePath);
  } catch (error) {
    sentryCapture(error);
    console.log(error);
  } finally {
    console.log('[createPost] Task finished');
    setTimeout(taskCreatePost, 1 * (60 * 1000));
  }
}

module.exports = { taskCreatePost };
