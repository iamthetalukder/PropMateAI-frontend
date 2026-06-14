const mailchimp = require("@mailchimp/mailchimp_marketing");
const crypto = require("crypto");

// One-time config initialisation
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// MD5 hash of lowercase email — Mailchimp's subscriber identifier
function subscriberHash(email) {
  return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}

// Upserts a contact into the Mailchimp audience and sets their tags
async function addToAudience(email, firstName, lastName, tags) {
  try {
    await mailchimp.lists.setListMember(AUDIENCE_ID, subscriberHash(email), {
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: firstName || "",
        LNAME: lastName || "",
      },
    });

    if (tags && tags.length > 0) {
      await mailchimp.lists.updateListMemberTags(
        AUDIENCE_ID,
        subscriberHash(email),
        {
          tags: tags.map((t) => ({ name: t, status: "active" })),
        },
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Mailchimp addToAudience error:", error.message || error);
    return { success: false, error: error.message || "Mailchimp error" };
  }
}

// Updates the tags on an existing subscriber
async function updateContactTags(email, tags) {
  try {
    await mailchimp.lists.updateListMemberTags(
      AUDIENCE_ID,
      subscriberHash(email),
      {
        tags: tags.map((t) => ({ name: t, status: "active" })),
      },
    );
    return { success: true };
  } catch (error) {
    console.error("Mailchimp updateContactTags error:", error.message || error);
    return { success: false, error: error.message || "Mailchimp error" };
  }
}

// Creates a campaign targeting a tag segment, sets HTML content, sends immediately
async function sendCampaignEmail(subject, htmlContent, segmentTag) {
  try {
    const recipientsPayload = { list_id: AUDIENCE_ID };

    if (segmentTag && segmentTag !== "all") {
      recipientsPayload.segment_opts = {
        conditions: [
          {
            condition_type: "Tag",
            op: "is",
            field: "tag",
            value: segmentTag,
          },
        ],
        match: "all",
      };
    }

    const campaign = await mailchimp.campaigns.create({
      type: "regular",
      recipients: recipientsPayload,
      settings: {
        subject_line: subject,
        from_name: "PropMate AI",
        reply_to: process.env.FROM_EMAIL || "noreply@propmateai.com",
      },
    });

    await mailchimp.campaigns.setContent(campaign.id, { html: htmlContent });
    await mailchimp.campaigns.send(campaign.id);

    return campaign.id;
  } catch (error) {
    console.error("Mailchimp sendCampaignEmail error:", error.message || error);
    throw error;
  }
}

// Sets a subscriber status to unsubscribed
async function removeFromAudience(email) {
  try {
    await mailchimp.lists.updateListMember(
      AUDIENCE_ID,
      subscriberHash(email),
      { status: "unsubscribed" },
    );
    return { success: true };
  } catch (error) {
    console.error("Mailchimp removeFromAudience error:", error.message || error);
    return { success: false, error: error.message || "Mailchimp error" };
  }
}

module.exports = {
  addToAudience,
  updateContactTags,
  sendCampaignEmail,
  removeFromAudience,
};
