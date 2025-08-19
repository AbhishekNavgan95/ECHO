import express from "express";
import { User } from "../models/User.js";
import {
  verifyGoogleIdToken,
  signUserToken,
  setAuthCookie,
  clearAuthCookie,
} from "../middleware/auth.js";

const router = express.Router();

// POST /auth/google - exchange Google ID token for app JWT cookie
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken)
      return res.status(400).json({ ok: false, error: "idToken is required" });

    const google = await verifyGoogleIdToken(idToken);
    const email = google.email?.toLowerCase();
    if (!email)
      return res
        .status(400)
        .json({ ok: false, error: "Email not present on Google profile" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: google.name || "",
        avatarUrl:
          google.picture ||
          `https://ui-avatars.com/api/?name=${google.name.replaceAll(
            " ",
            "%20"
          )}`,
        provider: "google",
        providerId: google.sub,
      });
    }

    const token = signUserToken(user);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const user = req.user || null;
  res.json({ ok: true, user });
});

export default router;
