const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.auth = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      return res.status(401).json({ message: "No Token, Authorization Denied" });
    }
    const token = headerToken.split(" ")[1];

    const secret = process.env.JWT_SECRET || "default_secret_please_change";
    const decoded = jwt.verify(token, secret);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Token Invalid" });
  }
};

exports.adminCheck = async (req, res, next) => {
  try {
    const { username } = req.user;
    const adminUser = await prisma.users.findFirst({
      where: { username: username },
    });
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin Access Denied" });
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Admin Access Denied" });
  }
};

exports.userCheck = async (req, res, next) => {
    try {
      const { username } = req.user;
      const user = await prisma.users.findFirst({
        where: { username: username },
      });
      // Assuming 'hospital' or 'user' is the standard user role. 
      // If we strictly want to separate 'user' vs 'admin', we ensuring they are not admin or are explicitly a user role.
      // For now, I'll allow access if they are authenticated and exist, unless we want to restrict specific routes to ONLY 'user/hospital'.
      // If the request implies "separate rights", likely we want to ensure they have the 'user' role (or 'hospital').
      
      // Let's assume standard users have role 'hospital' based on previous file, or 'user'.
      if (!user || (user.role !== "user" && user.role !== "hospital")) {
        return res.status(403).json({ message: "User Access Denied" });
      }
      next();
    } catch (err) {
      console.log(err);
      res.status(403).json({ message: "User Access Denied" });
    }
  };
