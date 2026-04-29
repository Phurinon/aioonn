const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const email = profile.email || profile.emails[0].value;
        const displayName = profile.displayName;

        let user = await prisma.users.findFirst({
          where: {
            OR: [
              { username: email },
              { username: displayName },
              { email: email },
            ],
          },
        });

        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const dummyPassword = await bcrypt.hash(
            "GOOGLE_AUTH_" + profile.id + "_" + Date.now(),
            salt
          );

          user = await prisma.users.create({
            data: {
              username: displayName,
              displayName: displayName,
              password: dummyPassword,
              role: "hospital",
              email: email,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), authController.googleCallback);
router.put("/auth/change-password", authController.changePassword);
router.post("/auth/verify-password", authController.verifyPassword);

module.exports = router;
