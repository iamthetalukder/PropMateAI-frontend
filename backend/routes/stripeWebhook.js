const express = require("express");
const Stripe = require("stripe");
const User = require("../models/User");
const mailchimpService = require("../utils/mailchimpService");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/webhook — receives raw Stripe events and updates user subscription state
// Must be registered before express.json() so the raw body is available for signature verification
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      return res.status(400).json({ message: `Webhook error: ${error.message}` });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata.userId;
          const plan = session.metadata.plan;

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              plan,
              subscriptionStatus: "active",
              stripeSubscriptionId: session.subscription,
            },
            { new: true },
          );

          if (updatedUser) {
            mailchimpService
              .updateContactTags(updatedUser.email, ["landlord", plan + "-plan"])
              .catch(console.error);
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription,
          );

          const user = await User.findOne({
            stripeCustomerId: invoice.customer,
          });

          if (user) {
            user.subscriptionStatus = "active";
            user.planExpiresAt = new Date(
              subscription.current_period_end * 1000,
            );
            await user.save();
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          await User.findOneAndUpdate(
            { stripeCustomerId: invoice.customer },
            { subscriptionStatus: "past_due" },
          );
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          await User.findOneAndUpdate(
            { stripeCustomerId: subscription.customer },
            {
              plan: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
            },
          );
          break;
        }

        default:
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
