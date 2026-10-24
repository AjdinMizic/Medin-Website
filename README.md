# Med1n portfolio: setup

Files: `index.html` (the whole page), `api/youtube.js` (server function that talks to YouTube).

## 1. Get a YouTube API key (free)
1. Go to console.cloud.google.com and create a project.
2. Enable "YouTube Data API v3".
3. Credentials > Create credentials > API key. Restrict it to the YouTube Data API v3.

## 2. Deploy (Vercel)
1. Put this folder in a GitHub repo and import it on vercel.com.
2. Add environment variable `YOUTUBE_API_KEY` with your key.
3. Optional: `YOUTUBE_HANDLE` (default `med1nmed1n`).
4. Deploy. The page calls `/api/youtube` every 60 seconds.

## 3. Contact form (needs email setup)
1. Create a free account at resend.com and make an API key.
2. In Vercel add `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (the address that receives messages).
3. For testing, emails come from onboarding@resend.dev. To send from your own domain, verify it in Resend and set `CONTACT_FROM_EMAIL`.
Until these are set, the form shows a clear error and nothing is lost silently.

## 4. Edit settings
Open `index.html` and change the `CONFIG` block near the bottom:
Instagram link, TikTok link, and a featured video id.

## Notes
- YouTube rounds public subscriber counts (for example 12,345 shows as 12,300), and the API does not push live events. The page shows what YouTube reports and re-checks every minute.
- Comments come from the newest 4 videos (up to 4 each) and use extra API quota. If a video has comments turned off, it is skipped. Comments are shown as plain text, but YouTube's own moderation is the only filter, so check the section now and then.
- Without the API key, the page shows "Live data is not connected yet" and never invents numbers.
- Test locally with `npx vercel dev`.
