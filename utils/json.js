const imageToBase64 = require('image-to-base64');
const { sentryCapture } = require('./sentry');

async function instagramMediaJSONParser(dataResponse) {
  try {
    const base64images = true;
    const base64imagesCarousel = false;
    const base64videos = false;
    const maxImages = 12;
    const json = dataResponse;
    const items = json?.data?.user?.edge_owner_to_timeline_media?.edges || [];
    const filteredItems = items?.filter((el, index) => (!maxImages ? el : index < maxImages));
    const mappedItems = await Promise.all(filteredItems?.map(async (el) => {
      const imageBody = base64images ? await imageToBase64(el?.node?.display_url) : false;
      const image = imageBody || false;
      const obj = {
        id: el?.node?.id,
        time: el?.node?.taken_at_timestamp,
        imageUrl: el?.node?.display_url,
        likes: el?.node?.edge_liked_by?.count,
        comments: el?.node?.edge_media_to_comment?.count,
        link: `https://www.instagram.com/p/${el?.node?.shortcode}/`,
        text: el?.node?.edge_media_to_caption?.edges?.[0]?.node?.text,
      };

      const location = el?.node?.location?.name;
      if (location) obj.location = location;

      const carouselNodes = el?.node?.edge_sidecar_to_children?.edges;
      if (carouselNodes?.length) {
        obj.carousel = [...carouselNodes]?.map(async (node) => {
          const temp = { imageUrl: node?.node?.display_url };
          if (base64imagesCarousel) temp.image = await imageToBase64(node?.node?.display_url);
          return temp;
        });
      }

      if (image) obj.image = image;

      if (
        el?.node?.is_video
              && el?.node?.video_url
      ) {
        obj.videoUrl = el?.node?.video_url;
        obj.videoViewCount = el?.node?.video_view_count;
        if (base64videos) obj.video = await imageToBase64(el?.node?.video_url);
      }

      return obj;
    }));

    return mappedItems;
  } catch (error) {
    sentryCapture(error);
    console.log(error);
    return false;
  }
}

module.exports = { instagramMediaJSONParser };
