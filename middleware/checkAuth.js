const jwt = require("jsonwebtoken");
const User = require("../models/user");
const mongoose = require("mongoose");
require("dotenv").config();
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "fallback-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";
// kiểm tra xem người dùng đã đăng nhập chưa? Có thể là admin, partner và client
exports.checkAuth = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  console.log("authHeader 1");
  if (!authHeader) {
    console.log("authHeader 2", authHeader);
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    console.log(decodedToken);
  } catch (err) {
    console.log(err);
    // Phân loại lỗi chi tiết
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Lỗi không xác định
    return res.status(500).json({ message: "Authentication failed" });
  }
  if (!decodedToken) {
    return res.status(401).send("Not authenticated");
  }
  const user = await User.findById(
    new mongoose.Types.ObjectId(decodedToken.userId)
  );
  if (user && user.status.toLowerCase() === "dừng hoạt động") {
    return res.status(403).json({
      path: "status",
      message: "Tài khoản của bạn đã bị dừng hoạt đông!",
    });
  } else {
    req.userId = decodedToken.userId;
    return next();
  }
};
//kiểm tra xem người dùng đã đăng nhập có phải là partner và admin không?
exports.checkPartnerAndAdmin = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    // Phân loại lỗi chi tiết
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Lỗi không xác định
    return res.status(500).json({ message: "Authentication failed" });
  }
  if (!decodedToken) {
    return res.status(401).send("Not authenticated");
  }
  const user = await User.findById(
    new mongoose.Types.ObjectId(decodedToken.userId)
  );
  if (user.status.toLowerCase() === "dừng hoạt động") {
    return res.status(403).json({
      path: "status",
      message: "Tài khoản của bạn đã bị dừng hoạt đông!",
    });
  }
  if (
    user.role === "partner" ||
    user.role === "admin 1" ||
    user.role === "admin 2"
  ) {
    req.userId = decodedToken.userId;
    return next();
  }
  return res
    .status(403)
    .json({ path: "status", message: "Bạn không được cấp quyền" });
};
//kiểm tra xem người đăng nhập có phải là admin không?
exports.checkDefaultAdmin = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    // Phân loại lỗi chi tiết
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Lỗi không xác định
    return res.status(500).json({ message: "Authentication failed" });
  }
  if (!decodedToken) {
    return res.status(401).send("Not authenticated");
  }
  const user = await User.findById(
    new mongoose.Types.ObjectId(decodedToken.userId)
  );

  if (user.role === "admin 1") {
    req.userId = decodedToken.userId;
    return next();
  }
};
exports.checkAdmin = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    // Phân loại lỗi chi tiết
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Lỗi không xác định
    return res.status(500).json({ message: "Authentication failed" });
  }
  if (!decodedToken) {
    return res.status(401).send("Not authenticated");
  }
  const user = await User.findById(
    new mongoose.Types.ObjectId(decodedToken.userId)
  );
  if (user.status.toLowerCase() === "dừng hoạt động") {
    return res.status(403).json({
      path: "status",
      message: "Tài khoản của bạn đã bị dừng hoạt đông!",
    });
  }
  if (user.role === "admin 1" || user.role === "admin 2") {
    req.userId = decodedToken.userId;
    return next();
  }
  return res
    .status(403)
    .json({ path: "status", message: "Bạn không được cấp quyền" });
};
exports.checkPartner = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).send("Not authenticated");
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    // Phân loại lỗi chi tiết
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    // Lỗi không xác định
    return res.status(500).json({ message: "Authentication failed" });
  }
  if (!decodedToken) {
    return res.status(401).send("Not authenticated");
  }
  const user = await User.findById(
    new mongoose.Types.ObjectId(decodedToken.userId)
  );
  if (user.status.toLowerCase() === "dừng hoạt động") {
    return res.status(403).json({
      path: "status",
      message: "Tài khoản của bạn đã bị dừng hoạt đông!",
    });
  }
  if (user.role === "partner") {
    req.userId = decodedToken.userId;
    return next();
  }
  return res
    .status(403)
    .json({ path: "status", message: "Bạn không được cấp quyền" });
};
