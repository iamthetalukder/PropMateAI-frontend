const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  addToAudience,
  updateContactTags,
  sendCampaignEmail,
  removeFromAudience,
} = require("../utils/mailchimpService");

const router = express.Router();

// POST /api/mailchimp/subscribe — adds a user to the audience with plan tags
router.post("/subscribe", authMiddleware, async (req, res) => {
  try {
    const { email, firstName, lastName, plan } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const tags = ["landlord", (plan || "free") + "-plan"];
    const result = await addToAudience(email, firstName || "", lastName || "", tags);
    res.json(result);
  } catch (error) {
    console.error("Mailchimp subscribe error:", error.message);
    res.status(500).json({ message: "Subscribe failed" });
  }
});

// POST /api/mailchimp/update-plan — updates the plan tag for an existing subscriber
router.post("/update-plan", authMiddleware, async (req, res) => {
  try {
    const { email, newPlan } = req.body;

    if (!email || !newPlan) {
      return res.status(400).json({ message: "email and newPlan are required" });
    }

    const result = await updateContactTags(email, ["landlord", newPlan + "-plan"]);
    res.json(result);
  } catch (error) {
    console.error("Mailchimp update-plan error:", error.message);
    res.status(500).json({ message: "Update plan failed" });
  }
});

// POST /api/mailchimp/send-announcement — admin only, sends a campaign to a segment
router.post("/send-announcement", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin role required" });
    }

    const { subject, htmlContent, targetPlan } = req.body;

    if (!subject || !htmlContent) {
      return res.status(400).json({ message: "subject and htmlContent are required" });
    }

    const segmentTag = targetPlan && targetPlan !== "all" ? targetPlan + "-plan" : null;
    const campaignId = await sendCampaignEmail(subject, htmlContent, segmentTag);

    res.json({ success: true, campaignId });
  } catch (error) {
    console.error("Mailchimp send-announcement error:", error.message);
    res.status(500).json({ message: "Campaign send failed: " + error.message });
  }
});

// POST /api/mailchimp/unsubscribe — removes a contact from the audience
router.post("/unsubscribe", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const result = await removeFromAudience(email);
    res.json(result);
  } catch (error) {
    console.error("Mailchimp unsubscribe error:", error.message);
    res.status(500).json({ message: "Unsubscribe failed" });
  }
});

module.exports = router;
