const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const logger = require("../logger");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");

// Register Endpoint
// Register Endpoint
router.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Check for existing user
    const existingUser = await prisma.users.findFirst({
      where: { username: username },
    });

    if (existingUser) {
      logger.warn(`Registration failed: Username ${username} already exists`);
      return res
        .status(400)
        .json({ message: "Username already exists. Please choose another one." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        username,
        displayName: username,
        password: hashedPassword,
        role: role || "hospital",
      },
    });

    logger.info(`Registration successful: ${username} (ID: ${newUser.id})`);
    return res.status(201).json({ message: "Registration successful", userId: newUser.id });
  } catch (error) {
    logger.error("Registration failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login Endpoint
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username
    const user = await prisma.users.findFirst({
      where: { username: username },
    });

    if (!user) {
      logger.warn(`Login failed: Invalid username ${username}`);
      return res.status(400).json({ message: "Invalid username" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Invalid password ${username}`);
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT Token
    // Make sure JWT_SECRET is in your .env file
    const secret = process.env.JWT_SECRET || "default_secret_please_change";
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: "1d" }
    );

    logger.info(`Login successful: ${username}`);
    return res.json({
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

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

        // Find user by username (using email or displayName)
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
          // Create new user if not exists
          // Use a dummy password for Google users
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
              role: "hospital", // Default role
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

// Google Auth Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Google Auth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT Token
    const user = req.user;
    const secret = process.env.JWT_SECRET || "default_secret_please_change";
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: "1d" }
    );

    // Redirect to frontend with token and user info
    // Adjust the frontend URL as needed
    const frontendUrl = "http://localhost:5173";
    const userData = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
      })
    );
    res.redirect(`${frontendUrl}?token=${token}&user=${userData}`);
  }
);

module.exports = router;
