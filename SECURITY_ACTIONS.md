# PropMate AI — Security & Bug-Fix Actions

**Date:** 22 May 2026
**Prepared by:** Claude
**For:** Talukder Abir Hasan, Founder & CEO, FrictionLab

---

## Summary

A code review flagged two issues:

1. **Security:** `backend/.env` contained live MongoDB credentials and a weak JWT secret in plaintext.
2. **Bug:** Frontend `Update Property` call sent PUT to the wrong URL, causing silent edit failures.

This memo records what was fixed automatically and what remains for you to do.

---

## ✅ Done (no action needed from you)

### 1. Git-history audit — `.env` was NEVER committed

Confirmed via `git log` and `git ls-files`:
- `backend/.env` is not currently tracked by git.
- `backend/.env` has zero commit history.
- The root `.gitignore` already excluded `backend/.env`, `.env`, `.env.local` from day one.

**Conclusion:** Your MongoDB credentials were NOT exposed via GitHub. The earlier "rotate MongoDB password" alarm has been downgraded — see "Optional but recommended" below.

### 2. Defense-in-depth `backend/.gitignore` created

New file: `backend/.gitignore`

Excludes `.env`, `.env.*`, `node_modules/`, `uploads/`, logs, OS junk, and editor folders. Survives folder moves and fresh clones (the root `.gitignore` covers this too, but defense in depth.)

### 3. `backend/.env.example` template created

New file: `backend/.env.example`

Documents the env-var shape (PORT, MONGO_URI, JWT_SECRET, plus future placeholders for CLAUDE_API_KEY, STRIPE_SECRET_KEY, RESEND_API_KEY) without any real secrets. Future contributors copy this to `.env` and fill in their own values.

### 4. JWT secret rotated to high-entropy random string

**Before:** `JWT_SECRET=super_secure_frictionlab_2026`
This was a dictionary-derived predictable string. Brute-forceable in seconds.

**After:** A fresh 96-character cryptographically random hex string generated via `crypto.randomBytes(48)`. Written directly into `backend/.env`.

**Side effect you should know about:**
- All JWTs issued under the old secret are now invalid.
- Any currently-logged-in beta tester will be silently logged out on their next request.
- They simply log back in — no data loss, no support burden.
- If you have an active beta running and want to avoid the disruption, you can revert the secret temporarily by replacing it with the old value, but this is not recommended for any environment that will see real users.

### 5. PUT bug fixed in `frontend/app/page.tsx`

**Before (line 192–201):**
```javascript
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/properties`,
  {
    method: "PUT",
    ...
  },
);
```
Backend route is defined as `PUT /api/properties/:id`. Without `:id` in the URL, Express never matched the route, requests likely returned 404 or fell through, and edits failed silently.

**After:**
```javascript
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${editingId}`,
  {
    method: "PUT",
    ...
  },
);
```
Plus a code comment explaining the route shape and a removed redundant `formData.append("id", editingId)` (the backend reads it from `req.params.id`, not the body).

**To verify the fix works:**
1. `cd backend && npm run dev` (or `node server.js`)
2. `cd frontend && npm run dev`
3. Log in, create a property, then edit it.
4. The "Property updated successfully" alert should now actually reflect a real backend update — confirm by refreshing the dashboard.

---

## ⚠️ Optional but recommended (your call)

### A. Rotate MongoDB Atlas password

**Why optional:** Your credentials were never in git history, so they are not publicly exposed.

**Why still recommended:**
- The credentials sat in `backend/.env` on your local machine for ~2 months.
- If your laptop was ever screen-shared, photographed, or had its drive imaged, the creds were visible.
- Atlas passwords are easy to rotate, and rotating refreshes your security posture for free.

**Steps:**
1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Database Access → click on the user `asenaabir`
3. Click "Edit" → "Edit Password" → "Autogenerate Secure Password" → Save
4. Copy the new password.
5. Update `backend/.env`: replace the password segment in `MONGO_URI` with the new one.
6. Restart your backend (`Ctrl+C` then `npm run dev`).

### B. Lock down MongoDB Atlas IP allowlist

The default Atlas setup often allows connections from `0.0.0.0/0` (anywhere). This is fine during development but terrible for production.

**Steps:**
1. Atlas → Network Access → IP Access List
2. If you see `0.0.0.0/0`, remove it.
3. Add your home/office IP, and your deployment provider's IP range when you deploy.
4. For local dev only, "ADD CURRENT IP ADDRESS" works.

### C. Add rate limiting to `/api/auth` endpoints

Currently `POST /api/auth/login` and `POST /api/auth/register` have no rate limiting. A bot can hammer them.

**Quick fix:** install `express-rate-limit` (~ 2 minutes of work):
```bash
cd backend && npm install express-rate-limit
```

Then in `routes/authRoutes.js`:
```javascript
const rateLimit = require("express-rate-limit");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP per window
  message: "Too many auth attempts. Try again later.",
});

router.post("/login", authLimiter, async (req, res) => { ... });
router.post("/register", authLimiter, async (req, res) => { ... });
```

Not urgent for pre-launch beta, mandatory before public launch (Nov 19).

---

## 🔜 Pre-launch checklist (track in PropMate brief, Section 7.3)

These items are documented in the PropMate brief and should be done before Nov 19, 2026:

- [ ] Add email verification to user signup
- [ ] Add password-reset flow
- [ ] Add rate limiting to `/api/auth` endpoints (see C above)
- [ ] Wire "AI Insights" card to actual Claude API (currently rule-based if/else)
- [ ] Add `Intl.NumberFormat` currency formatting throughout dashboard
- [ ] Migrate `/uploads` storage from local disk to S3 or Cloudflare R2
- [ ] Schema migration: add `tenants[]` and `organization` to `Property` model
- [ ] Add `Tenant`, `Lease`, `MaintenanceRequest`, `Organization` models
- [ ] Set up Sentry (error tracking) and PostHog (product analytics)
- [ ] Move MongoDB Atlas to dedicated M10 cluster (~$60/mo)

---

## Next step — commit the changes

The fixes above (gitignore, .env.example, .env JWT rotation, page.tsx bug fix) are made but not committed. Run:

```bash
cd C:\Users\Hasan Abir\ClaudeWork\FrictionLab\01_Products\PropMate_AI
git status
git add backend/.gitignore backend/.env.example frontend/app/page.tsx
git commit -m "fix: rotate JWT secret, fix PUT property URL, add backend gitignore + env example"
git push
```

**Note:** Do NOT add `backend/.env` to the commit (it is correctly gitignored). Confirm by checking the `git status` output before running `git add`.

---

*Prepared by Claude for FrictionLab. Where Innovation Meets Execution.*
