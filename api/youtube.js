// Vercel serverless endpoint: /api/youtube
// Store YOUTUBE_API_KEY in Vercel Environment Variables; never put it in app.js.
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const CHANNEL_HANDLE = process.env.YOUTUBE_HANDLE || "med1nmed1n";
const CACHE_SECONDS = 300;

let cachedResponse = { createdAt: 0, payload: null };

async function youtubeRequest(resource, parameters) {
  const url = new URL(`${YOUTUBE_API_BASE}/${resource}`);
  for (const [name, value] of Object.entries({
    ...parameters,
    key: process.env.YOUTUBE_API_KEY,
  })) {
    url.searchParams.set(name, value);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
  return response.json();
}

async function getRecentComments(videos) {
  const comments = [];
  // Keep this small: each commentThreads request uses YouTube API quota.
  for (const video of videos.slice(0, 3)) {
    try {
      const response = await youtubeRequest("commentThreads", {
        part: "snippet",
        videoId: video.id,
        order: "relevance",
        maxResults: "3",
        textFormat: "plainText",
      });
      for (const item of response.items || []) {
        const snippet = item.snippet.topLevelComment.snippet;
        comments.push({
          author: snippet.authorDisplayName,
          authorImage: snippet.authorProfileImageUrl,
          text: String(snippet.textDisplay || "").slice(0, 360),
          publishedAt: snippet.publishedAt,
          videoId: video.id,
        });
      }
    } catch {
      // Comments can be disabled on individual videos; skip those and continue.
    }
  }
  return comments;
}

async function getChannelData() {
  const channelResponse = await youtubeRequest("channels", {
    part: "snippet,statistics,contentDetails",
    forHandle: CHANNEL_HANDLE,
  });
  const channel = channelResponse.items?.[0];
  if (!channel)
    throw new Error(`Could not find YouTube channel @${CHANNEL_HANDLE}`);

  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
  const uploadsResponse = await youtubeRequest("playlistItems", {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: "9",
  });
  const videos = (uploadsResponse.items || [])
    .map((item) => {
      const snippet = item.snippet;
      const id = snippet.resourceId?.videoId;
      return id
        ? {
            id,
            title: snippet.title,
            description: snippet.description || "",
            publishedAt: snippet.publishedAt,
            thumbnail:
              snippet.thumbnails?.maxres?.url ||
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          }
        : null;
    })
    .filter(Boolean);

  return {
    subscribers: channel.statistics.hiddenSubscriberCount
      ? null
      : Number(channel.statistics.subscriberCount),
    avatar:
      channel.snippet.thumbnails?.high?.url ||
      channel.snippet.thumbnails?.default?.url ||
      "",
    videos,
    comments: await getRecentComments(videos),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET")
    return response.status(405).json({ error: "Use GET." });
  if (!process.env.YOUTUBE_API_KEY)
    return response
      .status(503)
      .json({ error: "YOUTUBE_API_KEY is not configured." });

  try {
    if (
      !cachedResponse.payload ||
      Date.now() - cachedResponse.createdAt > CACHE_SECONDS * 1000
    ) {
      cachedResponse = {
        createdAt: Date.now(),
        payload: await getChannelData(),
      };
    }
    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600",
    );
    return response.status(200).json(cachedResponse.payload);
  } catch (error) {
    return response
      .status(502)
      .json({ error: error.message || "Unable to load YouTube data." });
  }
};
