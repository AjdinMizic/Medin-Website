/* All public links and the featured video are configured here. */
const SITE_CONFIG = {
  channelUrl: "https://www.youtube.com/@med1nmed1n",
  instagramUrl: "https://www.instagram.com/medin_yt/",
  tiktokUrl: "https://www.tiktok.com/@meediiin",
  featuredVideoId: "uhODrMhEU6I",
};

// Edit these example values by hand; the site does not fetch channel data.
const CHANNEL_SNAPSHOT = {
  subscribers: 2100,
  views: 600000,
  likes: 186000,
  videos: 26,
};

// Replace these sample reactions with comments you have permission to feature.
const FEATURED_COMMENTS = [
  { author: "Sample viewer", text: "The way you broke down the tactics made the whole match click.", videoId: SITE_CONFIG.featuredVideoId, videoTitle: "Featured video" },
  { author: "Sample viewer", text: "Finally, football analysis that explains the why behind the numbers.", videoId: SITE_CONFIG.featuredVideoId, videoTitle: "Featured video" },
  { author: "Sample viewer", text: "That one detail completely changed how I saw the game.", videoId: SITE_CONFIG.featuredVideoId, videoTitle: "Featured video" },
  { author: "Sample viewer", text: "More videos like this, please. The storytelling is brilliant.", videoId: SITE_CONFIG.featuredVideoId, videoTitle: "Featured video" },
  { author: "Sample viewer", text: "You made a complicated topic feel simple without losing the detail.", videoId: SITE_CONFIG.featuredVideoId, videoTitle: "Featured video" },
];

const byId = (id) => document.getElementById(id);
const videoUrl = (id) =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
const thumbnailUrl = (id) =>
  `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setConfiguredLinks() {
  document.querySelectorAll("[data-channel-link]").forEach((link) => {
    link.href = SITE_CONFIG.channelUrl;
  });
  document.querySelectorAll("[data-instagram-link]").forEach((link) => {
    if (SITE_CONFIG.instagramUrl) link.href = SITE_CONFIG.instagramUrl;
    else link.hidden = true;
  });
  document.querySelectorAll("[data-tiktok-link]").forEach((link) => {
    if (SITE_CONFIG.tiktokUrl) link.href = SITE_CONFIG.tiktokUrl;
    else link.hidden = true;
  });
  byId("year").textContent = new Date().getFullYear();
}

function formatCount(value) {
  return Number(value).toLocaleString();
}

function renderSnapshot() {
  document.querySelectorAll("[data-count]").forEach((element) => {
    const key = element.dataset.stat;
    const target = CHANNEL_SNAPSHOT[key] ?? Number(element.dataset.count);
    element.dataset.count = String(target);
    element.textContent = formatCount(target);
  });
}

function renderCommentTicker() {
  const track = byId("comment-track");
  const makeSet = (hidden = false) => {
    const group = make("div", "comment-group");
    if (hidden) group.setAttribute("aria-hidden", "true");
    FEATURED_COMMENTS.forEach((comment) => {
      const card = make("article", "comment-card");
      card.append(
        make("p", "comment-text", `“${comment.text}”`),
        make("div", "comment-author", comment.author),
      );
      if (/^[\w-]{11}$/.test(comment.videoId || "")) {
        const videoLink = make("a", "comment-video-link", `View video: ${comment.videoTitle || "YouTube video"} ↗`);
        videoLink.href = videoUrl(comment.videoId);
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
        if (hidden) videoLink.tabIndex = -1;
        card.appendChild(videoLink);
      }
      group.appendChild(card);
    });
    return group;
  };
  track.replaceChildren(makeSet(), makeSet(true));
}

function createVideoThumbnail(video, featured = false) {
  // A standard YouTube watch link opens in a browser or hands off to the YouTube app.
  const link = make("a", "video-thumb");
  link.href = videoUrl(video.id);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `Watch ${video.title} on YouTube`);
  const image = document.createElement("img");
  image.src = video.thumbnail || thumbnailUrl(video.id);
  image.alt = `Thumbnail: ${video.title}`;
  image.loading = featured ? "eager" : "lazy";
  image.onerror = () => {
    image.onerror = null;
    image.src = thumbnailUrl(video.id);
  };
  const badge = make("span", "play-badge");
  badge.setAttribute("aria-hidden", "true");
  badge.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10-6.5z"/></svg>';
  link.append(image, badge);
  return link;
}

function renderFeatured(video) {
  const panel = byId("featured-video");
  panel.replaceChildren();
  panel.appendChild(createVideoThumbnail(video, true));
  const copy = make("div", "featured-copy");
  copy.appendChild(make("p", "eyebrow", "MED1N PICK"));
  copy.appendChild(make("h3", "", "Who Is ACTUALLY The Greatest National Team Of All Time?"));
  const description = (video.description || "Watch the full video on YouTube.")
    .split("\n")[0]
    .slice(0, 200);
  copy.appendChild(make("p", "", description));
  const watchLink = make("a", "button button-primary", "Watch on YouTube ↗");
  watchLink.href = videoUrl(video.id);
  watchLink.target = "_blank";
  watchLink.rel = "noopener noreferrer";
  copy.appendChild(watchLink);
  panel.appendChild(copy);
}

function renderConfiguredFeature() {
  const id = String(SITE_CONFIG.featuredVideoId || "").trim();
  if (!/^[\w-]{11}$/.test(id)) {
    byId("featured-video").replaceChildren(
      make(
        "p",
        "notice",
        "Set an 11-character YouTube video ID in app.js to choose a featured video.",
      ),
    );
    return;
  }
  renderFeatured({
    id,
    title: "Featured video",
    description: "Watch the featured video on YouTube.",
    thumbnail: thumbnailUrl(id),
  });
}

function setupNavigation() {
  const toggle = byId("nav-toggle");
  const nav = byId("nav-links");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

setConfiguredLinks();
setupNavigation();
renderConfiguredFeature();
renderSnapshot();
renderCommentTicker();
