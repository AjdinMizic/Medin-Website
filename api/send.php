<?php
// Native HTML form handler for Vercel's community PHP runtime.

const MAX_BODY_LENGTH = 12000;
const IP_COOLDOWN_SECONDS = 45;

function showResult(int $status, string $heading, string $message): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $safeHeading = htmlspecialchars($heading, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#080808" />
    <title>{$safeHeading} · Med1n</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="container" style="padding-block: 90px; min-height: 70vh">
      <p class="eyebrow">MED1N · CONTACT</p>
      <h1 style="font-size: clamp(38px, 7vw, 64px)">{$safeHeading}</h1>
      <p>{$safeMessage}</p>
      <a class="button button-primary" href="/#contact">Back to the website <span aria-hidden="true">↗</span></a>
    </main>
  </body>
</html>
HTML;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    showResult(405, 'Use the contact form', 'Please return to the site and send your message through the contact form.');
}

// Keep the honeypot quiet so bots do not learn that they were detected.
if (!empty($_POST['website'])) {
    showResult(200, 'Message sent', 'Thanks for getting in touch.');
}

$apiKey = getenv('RESEND_API_KEY');
$recipient = getenv('CONTACT_TO_EMAIL') ?: 'mhadzalic43@gmail.com';
if (!$apiKey) {
    showResult(503, 'Form not configured', 'The contact form is not configured yet. Please try again later.');
}

$rawLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($rawLength > MAX_BODY_LENGTH) {
    showResult(413, 'Message is too large', 'Please shorten your message and try again.');
}

$name = trim(substr((string) ($_POST['name'] ?? ''), 0, 80));
$email = trim(substr((string) ($_POST['email'] ?? ''), 0, 120));
$topic = trim(substr((string) ($_POST['topic'] ?? 'Other'), 0, 40));
$message = trim(substr((string) ($_POST['message'] ?? ''), 0, 2500));
$featureConsent = ($_POST['featureConsent'] ?? '') === 'yes' ? 'Yes' : 'No';

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($message) < 10) {
    showResult(400, 'Check your message', 'Add your name, a valid email, and a message of at least 10 characters, then try again.');
}

$forwardedFor = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? 'unknown');
$clientIp = trim(explode(',', $forwardedFor)[0]);
$cooldownFile = sys_get_temp_dir() . '/med1n-contact-' . hash('sha256', $clientIp);
$lastSubmission = is_file($cooldownFile) ? (int) file_get_contents($cooldownFile) : 0;
if (time() - $lastSubmission < IP_COOLDOWN_SECONDS) {
    showResult(429, 'Please wait a moment', 'You recently sent a message. Please wait a little before sending another.');
}

$payload = [
    'from' => getenv('CONTACT_FROM_EMAIL') ?: 'Med1n Website <onboarding@resend.dev>',
    'to' => [$recipient],
    'reply_to' => $email,
    'subject' => '[Med1n ' . $topic . '] message from ' . $name,
    'text' => "Name: {$name}\nEmail: {$email}\nTopic: {$topic}\nMay be considered for a public highlight: {$featureConsent}\n\n{$message}",
    'html' => '<p><b>Name:</b> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') .
        '<br><b>Email:</b> ' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') .
        '<br><b>Topic:</b> ' . htmlspecialchars($topic, ENT_QUOTES, 'UTF-8') .
        '<br><b>May be considered for a public highlight:</b> ' . $featureConsent .
        '</p><p>' . nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>',
];

$curl = curl_init('https://api.resend.com/emails');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 15,
]);
$mailResponse = curl_exec($curl);
$mailStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($mailResponse === false || $mailStatus < 200 || $mailStatus >= 300) {
    showResult(502, 'Message not sent', 'The email service could not deliver your message. Please try again later.');
}

file_put_contents($cooldownFile, (string) time(), LOCK_EX);
$successMessage = $topic === 'Community comment for review'
    ? 'Thanks. Your comment was sent for review and will not appear on the site automatically.'
    : 'Thanks for getting in touch. Your message has been sent.';
showResult(200, 'Message sent', $successMessage);
