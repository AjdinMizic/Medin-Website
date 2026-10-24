// Serverless function (works on Vercel as /api/youtube; Netlify needs a small wrapper).
// The API key stays here on the server and is never sent to the browser.
//
// Environment variables:
//   YOUTUBE_API_KEY  - your YouTube Data API v3 key (required)
//   YOUTUBE_HANDLE   - channel handle without @ (optional, default: med1nmed1n)

const API = "https://www.googleapis.com/youtube/v3";
const CACHE_SECONDS = 60; // keeps API quota usage tiny

let cache = { time: 0, data: null }; // in-memory cache, shared between requests on a warm server

async function callYouTube(path, params) {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY })}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube API error ${response.status}`);
  return response.json();
}


// Loads a few top comments from the newest videos.
// A video with comments turned off is skipped instead of breaking everything.
async function loadComments(videos) {
  const comments = [];
  for (const video of videos.slice(0, 4)) {
    try {
      const result = await callYouTube("commentThreads", {
        part: "snippet",
        videoId: video.id,
        order: "relevance",
        maxResults: "4",
        textFormat: "plainText",
      });
      for (const item of result.items || []) {
        const comment = item.snippet.topLevelComment.snippet;
        comments.push({
          author: comment.authorDisplayName,
          authorImage: comment.authorProfileImageUrl,
          text: comment.textDisplay.slice(0, 280), // keep long comments short
          likes: comment.likeCount,
          publishedAt: comment.publishedAt,
          videoId: video.id,
          videoTitle: video.title,
        });
      }
    } catch (error) {
      // comments disabled or quota problem for this video: skip it
    }
  }
  return comments;
}

async function loadChannelData() {
  const handle = process.env.YOUTUBE_HANDLE || "med1nmed1n";

  // 1) Channel info: logo, subscriber count, and the "uploads" playlist id
  const channelResult = await callYouTube("channels", {
    part: "snippet,statistics,contentDetails",
    forHandle: handle,
  });
  const channel = channelResult.items && channelResult.items[0];
  if (!channel) throw new Error("Channel not found");

  // 2) Latest uploads (1 quota unit, much cheaper than search)
  const uploadsId = channel.contentDetails.relatedPlaylists.uploads;
  const uploadsResult = await callYouTube("playlistItems", {
    part: "snippet",
    playlistId: uploadsId,
    maxResults: "12",
  });

  const videos = uploadsResult.items.map((item) => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    thumbnail:
      (item.snippet.thumbnails.maxres || item.snippet.thumbnails.high || item.snippet.thumbnails.medium || {}).url || "",
    description: item.snippet.description,
  }));

  return {
    title: channel.snippet.title,
    avatar: (channel.snippet.thumbnails.high || channel.snippet.thumbnails.default).url,
    subscribers: channel.statistics.hiddenSubscriberCount ? null : Number(channel.statistics.subscriberCount),
    videos,
    comments: await loadComments(videos),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = async function handler(request, response) {
  if (!process.env.YOUTUBE_API_KEY) {
    return response.status(503).json({ error: "YOUTUBE_API_KEY is not set on the server." });
  }
  try {
    if (!cache.data || Date.now() - cache.time > CACHE_SECONDS * 1000) {
      cache = { time: Date.now(), data: await loadChannelData() };
    }
    response.setHeader("Cache-Control", `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`);
    return response.status(200).json(cache.data);
  } catch (error) {
    // Serve the last good result if we have one, so the page never breaks.
    if (cache.data) return response.status(200).json({ ...cache.data, stale: true });
    return response.status(502).json({ error: error.message });
  }
};
