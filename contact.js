// Serverless function that receives the contact form and emails it to you.
// It uses Resend (resend.com, free tier) so no email password is stored.
//
// Environment variables:
//   RESEND_API_KEY     - API key from resend.com (required)
//   CONTACT_TO_EMAIL   - the address that should receive the messages (required)
//   CONTACT_FROM_EMAIL - sender shown in the email (optional, default: onboarding@resend.dev for testing)

const requestLog = {}; // very simple rate limit: remembers recent requests per visitor
const MAX_REQUESTS = 3;       // messages allowed...
const WINDOW_MS = 10 * 60000; // ...per 10 minutes

function isRateLimited(visitorId) {
  const now = Date.now();
  const recent = (requestLog[visitorId] || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  requestLog[visitorId] = recent;
  return recent.length > MAX_REQUESTS;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Use POST." });

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL) {
    return response.status(503).json({ error: "The contact form is not set up yet." });
  }

  const visitorId = request.headers["x-forwarded-for"] || "unknown";
  if (isRateLimited(visitorId)) {
    return response.status(429).json({ error: "Too many messages. Please try again later." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};

  // Spam trap: bots fill the hidden field. Pretend it worked and do nothing.
  if (body.website) return response.status(200).json({ ok: true });

  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 120);
  const topic = String(body.topic || "Other").slice(0, 40);
  const message = String(body.message || "").trim().slice(0, 2000);

  if (!name || message.length < 10) {
    return response.status(400).json({ error: "Please add your name and a longer message." });
  }

  // Escape the visitor's text before putting it in an HTML email
  const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Med1n Site <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email || undefined,
        subject: "[" + topic + "] message from " + name,
        html: "<p><strong>" + escapeHtml(name) + "</strong> (" + escapeHtml(email || "no email given") + ")</p>" +
              "<p>Topic: " + escapeHtml(topic) + "</p><p>" + escapeHtml(message).replace(/\n/g, "<br>") + "</p>",
      }),
    });
    if (!result.ok) throw new Error("Email service error " + result.status);
    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(502).json({ error: "The message could not be sent. Please try again later." });
  }
};
