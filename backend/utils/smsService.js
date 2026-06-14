const twilio = require("twilio");

// Lazy-init: client is created on first call so missing env vars don't crash startup
function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Send an SMS — returns { success, error }. Never throws so callers won't crash.
async function sendSMS(to, message) {
  try {
    const client = getClient();
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return { success: true };
  } catch (error) {
    console.error("SMS send error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS };
