import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "easybill_super_secret_key_12345");

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      if (req.user.isActive === false) {
        return res.status(403).json({ message: "Not authorized, account is disabled" });
      }
      // Set business scoping ID
      if (req.user.role === "admin") {
        req.businessId = req.user._id;
      } else if (req.user.role === "employee") {
        req.businessId = req.user.adminId;
      } else {
        req.businessId = null; // Scoped by customer email/ID
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
