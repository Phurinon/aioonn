const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const logger = require("../logger");

exports.register = async (req, res) => {
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
};

exports.login = async (req, res) => {
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
};

exports.googleCallback = (req, res) => {
  // Generate JWT Token
  const user = req.user;
  const secret = process.env.JWT_SECRET || "default_secret_please_change";
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: "1d" }
  );

  // Redirect to frontend with token and user info
  // Use FRONTEND_URL from environment
  const frontendUrl = process.env.FRONTEND_URL;
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
    })
  );
  res.redirect(`${frontendUrl}?token=${token}&user=${userData}`);
};

exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    // Basic validation
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Username, old password, and new password are required" });
    }

    // Find user by username
    const user = await prisma.users.findFirst({
      where: { username: username },
    });

    if (!user) {
      logger.warn(`Change password failed: Invalid username ${username}`);
      return res.status(400).json({ message: "Invalid username" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn(`Change password failed: Incorrect old password for ${username}`);
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    logger.info(`Change password successful: ${username}`);
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error("Change password failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await prisma.users.findFirst({
      where: { username: username },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid user", valid: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password", valid: false });
    }

    return res.status(200).json({ message: "Password verified", valid: true });
  } catch (error) {
    logger.error("Verify password failed:", error);
    return res.status(500).json({ message: "Server error", valid: false });
  }
};
