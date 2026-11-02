/* All public links and the featured video are configured here. */
const SITE_CONFIG = {
  channelUrl: "https://www.youtube.com/@med1nmed1n",
  instagramUrl: "https://www.instagram.com/medin_yt/",
  tiktokUrl: "https://www.tiktok.com/@meediiin",
  featuredVideoId: "uhODrMhEU6I",
  apiUrl: "/api/youtube",
  contactApiUrl: "/api/contact",
};

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
  document.querySelectorAll("[data-videos-link]").forEach((link) => {
    link.href = `${SITE_CONFIG.channelUrl}/videos`;
  });
  byId("year").textContent = new Date().getFullYear();
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

function renderVideos(videos) {
  const grid = byId("video-grid");
  grid.replaceChildren();
  if (!videos.length) {
    grid.appendChild(
      make(
        "p",
        "notice",
        "No public videos were returned. Visit the channel to see all uploads.",
      ),
    );
    return;
  }
  videos.slice(0, 9).forEach((video) => {
    const card = make("article", "video-card");
    card.appendChild(createVideoThumbnail(video));
    const copy = make("div", "video-card-copy");
    copy.appendChild(make("h3", "", video.title));
    const date = make(
      "time",
      "",
      video.publishedAt
        ? new Date(video.publishedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "",
    );
    copy.appendChild(date);
    card.appendChild(copy);
    grid.appendChild(card);
  });
}

function renderComments(comments) {
  const grid = byId("comment-grid");
  grid.replaceChildren();
  if (!comments.length) {
    grid.appendChild(
      make(
        "p",
        "notice",
        "No public comments are available yet. Join the conversation on YouTube.",
      ),
    );
    return;
  }
  comments.forEach((comment) => {
    const card = make("article", "comment-card");
    const author = make("div", "comment-author");
    if (comment.authorImage) {
      const avatar = document.createElement("img");
      avatar.src = comment.authorImage;
      avatar.alt = "";
      avatar.loading = "lazy";
      author.appendChild(avatar);
    }
    author.appendChild(make("span", "", comment.author || "YouTube viewer"));
    card.append(author, make("p", "comment-text", comment.text));
    const meta = make("div", "comment-meta");
    meta.append(
      document.createTextNode(
        `${new Date(comment.publishedAt).toLocaleDateString()} · `,
      ),
    );
    const source = make("a", "", "View video");
    source.href = videoUrl(comment.videoId);
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    meta.appendChild(source);
    card.appendChild(meta);
    grid.appendChild(card);
  });
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

async function loadChannelData() {
  try {
    const response = await fetch(SITE_CONFIG.apiUrl, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(`YouTube endpoint returned ${response.status}`);
    const data = await response.json();
    if (data.subscribers !== null && data.subscribers !== undefined) {
      byId("subscriber-count").textContent = Number(
        data.subscribers,
      ).toLocaleString();
      byId("data-status").textContent =
        `Updated ${new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      byId("subscriber-count").textContent = "Hidden";
      byId("data-status").textContent =
        "Subscriber count is hidden by YouTube.";
    }
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const requestedFeature = videos.find(
      (video) => video.id === SITE_CONFIG.featuredVideoId,
    );
    if (requestedFeature) renderFeatured(requestedFeature);
    else if (!SITE_CONFIG.featuredVideoId && videos[0])
      renderFeatured(videos[0]);
    renderVideos(videos);
    renderComments(Array.isArray(data.comments) ? data.comments : []);
  } catch (error) {
    byId("subscriber-count").textContent = "—";
    byId("data-status").textContent =
      "Live stats and feeds need the YouTube API connection.";
    byId("video-grid").replaceChildren(
      make(
        "p",
        "notice",
        "Latest uploads are unavailable right now. The featured video and channel links still work.",
      ),
    );
    byId("comment-grid").replaceChildren(
      make(
        "p",
        "notice",
        "Comments need the YouTube API connection. You can still join the conversation on the channel.",
      ),
    );
  }
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

function setupContactForm() {
  const form = byId("contact-form");
  const button = byId("contact-submit");
  const status = byId("contact-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.className = "";
    status.textContent = "Sending…";
    try {
      const response = await fetch(SITE_CONFIG.contactApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Message could not be sent.");
      form.reset();
      status.className = "success";
      status.textContent = "Thanks! Your message has been sent.";
    } catch (error) {
      status.className = "error";
      status.textContent =
        error.message || "Could not send your message. Please try again later.";
    } finally {
      button.disabled = false;
    }
  });
}

setConfiguredLinks();
setupNavigation();
setupContactForm();
renderConfiguredFeature();
loadChannelData();
