const InstagramPublisher = require('instagram-publisher');

const instagramClient = new InstagramPublisher({
  email: process.env.INSTAGRAM_USERNAME,
  password: process.env.INSTAGRAM_PASSWORD,
  verbose: true,
});

module.exports = instagramClient;