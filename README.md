# Med1n website

This folder is a self-contained site with Vercel serverless endpoints for YouTube data and contact form delivery.

## Configure the content

Edit `app.js` → `SITE_CONFIG` to set the YouTube channel, Instagram, TikTok, and featured YouTube video ID. The video ID is the 11-character value after `v=` in a YouTube watch URL. Thumbnails link directly to YouTube and open in a new tab; on mobile, the device may open the YouTube app.

## Enable subscriber count, latest videos, and comments

1. Create a Google Cloud project and enable **YouTube Data API v3**.
2. Create an API key and restrict it to YouTube Data API v3.
3. Import the repository into Vercel. Set the Vercel **Root Directory** to `medin-clean`.
4. In Vercel, open **Project Settings → Environment Variables** and add `YOUTUBE_API_KEY` with the API key. Optionally set `YOUTUBE_HANDLE` (default: `med1nmed1n`).
5. Redeploy after saving the variables.

The key is read only by `api/youtube.js` on the server. Never put the key in `app.js` or commit it to Git. Without the Vercel endpoint and key, the configured featured video still works, while live counts and feeds explain that the API connection is needed.

## Receive contact messages

1. Create a Resend account and API key.
2. In Vercel Environment Variables, add `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (the inbox where messages should arrive).
3. Optionally add `CONTACT_FROM_EMAIL` after verifying your sender domain with Resend. Without it, the endpoint uses Resend's testing sender.
4. Redeploy. The form offers video idea, collaboration, sponsorship, and general message topics.

## Local preview

Use Vercel CLI from this folder with `vercel dev`. Add the same environment variables in Vercel's Development environment or a local ignored `.env.local` file.
