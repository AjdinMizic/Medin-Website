// Vercel serverless endpoint: safely deliver the viewer contact form via Resend.
// Set RESEND_API_KEY and CONTACT_TO_EMAIL in Vercel, never in client-side code.
const MAX_BODY_LENGTH = 12000;

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST")
    return response.status(405).json({ error: "Use POST." });
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL) {
    return response
      .status(503)
      .json({ error: "Contact form is not configured yet." });
  }

  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body || "{}")
        : request.body || {};
    if (body.website) return response.status(200).json({ ok: true }); // spam trap
    const name = String(body.name || "")
      .trim()
      .slice(0, 80);
    const email = String(body.email || "")
      .trim()
      .slice(0, 120);
    const topic = String(body.topic || "Other")
      .trim()
      .slice(0, 40);
    const message = String(body.message || "")
      .trim()
      .slice(0, 2500);
    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 10
    ) {
      return response
        .status(400)
        .json({
          error:
            "Add your name, a valid email, and a message of at least 10 characters.",
        });
    }
    if (JSON.stringify(body).length > MAX_BODY_LENGTH)
      return response.status(413).json({ error: "Message is too large." });

    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.CONTACT_FROM_EMAIL ||
          "Med1n Website <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `[Med1n ${topic}] message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
        html: `<p><b>Name:</b> ${escapeHtml(name)}<br><b>Email:</b> ${escapeHtml(email)}<br><b>Topic:</b> ${escapeHtml(topic)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      }),
    });
    if (!mailResponse.ok)
      return response
        .status(502)
        .json({
          error:
            "Email service could not deliver the message. Please try again later.",
        });
    return response.status(200).json({ ok: true });
  } catch {
    return response
      .status(400)
      .json({ error: "Please check the form and try again." });
  }
};
