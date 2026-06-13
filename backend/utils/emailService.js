const { Resend } = require("resend");

// Client is created lazily so a missing env var only throws when email is actually sent
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Sends a branded email verification link to the user's inbox
async function sendVerificationEmail(email, name, token) {
  const resend = getResend();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Verify your PropMate AI account",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#0B1120;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:12px;border:1px solid #1F2937;padding:40px;">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <h1 style="color:#4A9EFF;font-size:24px;margin:0;">PropMate AI</h1>
                  </td>
                </tr>
                <tr>
                  <td style="color:#E5E7EB;font-size:16px;line-height:1.6;padding-bottom:16px;">
                    Hi ${name},
                  </td>
                </tr>
                <tr>
                  <td style="color:#E5E7EB;font-size:16px;line-height:1.6;padding-bottom:32px;">
                    Thanks for signing up! Please verify your email address to activate your account.
                    This link expires in <strong>24 hours</strong>.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;background-color:#4A9EFF;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="color:#6B7280;font-size:13px;line-height:1.6;">
                    If you did not create a PropMate AI account, you can safely ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

module.exports = { sendVerificationEmail };
