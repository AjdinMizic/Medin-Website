# Med1n website

This folder contains a mostly static site. Channel stats and featured comments are entered by hand. The contact form submits as regular HTML to a PHP endpoint; it does not need browser JavaScript to send.

## Configure the content

Edit `app.js` → `SITE_CONFIG` to set the YouTube channel, Instagram, TikTok, and featured YouTube video ID. The video ID is the 11-character value after `v=` in a YouTube watch URL. Thumbnails link directly to YouTube and open in a new tab; on mobile, the device may open the YouTube app.

## Edit the channel snapshot and comments

Update `CHANNEL_SNAPSHOT` and `FEATURED_COMMENTS` near the top of `app.js`. These values are examples and do not update automatically. Each featured comment can include the viewer's display name, comment text, YouTube `videoId` (the 11-character ID from the watch URL), and `videoTitle`; the ticker uses that ID to link to the video. Add only reviewed comments you have permission to feature. The site does not call the YouTube Data API.

## Receive contact messages

1. Create a Resend account and API key.
2. In Vercel Environment Variables, add `RESEND_API_KEY`. Optionally add `CONTACT_TO_EMAIL` to override the recipient configured in `api/send.php`.
3. Optionally add `CONTACT_FROM_EMAIL` after verifying your sender domain with Resend. Without it, the endpoint uses Resend's testing sender.
4. Redeploy. `vercel.json` configures Vercel's community PHP runtime for `api/send.php`. The PHP handler sends mail through Resend and returns a confirmation page. Community comments arrive by email for review; they are never published automatically. The form uses a honeypot and a short per-IP cooldown stored in `/tmp`.

## Local preview

Open `index.html` directly to preview the static content. Contact form delivery requires PHP hosting with cURL enabled and the Resend API key configured. On Vercel, the PHP handler uses the community runtime configured in `vercel.json`; a static file server by itself cannot send the form.
