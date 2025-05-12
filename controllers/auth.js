const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const RefreshToken = require("../models/refreshToken");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const sendEmail = require("../utils/sendEmail");

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "fallback-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";

// Function to generate access token
function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "15m" }); // short lifespan
}

// Function to generate refresh token
function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return refreshToken;
}

exports.postSignUp = async (req, res) => {
  const { username, email, password } = req.body;
  console.log("req.body", req.body);
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array();
    console.log(errors);
    return res.status(400).json({ errors: errors });
  }

  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "client",
      isVerified: false,
    });

    // generate verification token
    const verificationToken = user.getVerificationToken();
    console.log("verificationToken", verificationToken);
    await user.save();
    const frontendUrl = process.env.FRONTEND_HOST;

    // Send verification email
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;
    console.log("verificationUrl", verificationUrl);
    const message = `Hãy xác nhận email của bạn bằng cách kích vào đường dẫn sau: ${verificationUrl}`;

    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    });

    return res.status(200).json({
      message: "Hãy kiểm tra đường dẫn xác nhận đăng ký trong email của bạn",
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500);
    return res.json({ message: "Lỗi máy chủ" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    console.log(typeof hashedToken);
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    }).exec();

    if (!user) {
      return res.status(400).json({ errors: "Mã xác nhận đã hết hạn. " });
    } else {
      if (user && !user.isVerified) {
        user.isVerified = true;

        user.status = "hoạt động";

        await user.save();

        return res.status(200).json({ message: "Đăng ký thành công!" });
      } else if (user && user.isVerified) {
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        return res.status(200).json({ message: "Đăng ký thành công!" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.postSignin = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  console.log("Request Body:", req.body);

  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = result.array()[0];
    return res
      .status(200)
      .json({ success: false, errors: { path: error.path, msg: error.msg } });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(200).json({
        success: false,
        errors: { path: "email", msg: "Email không chính xác!" },
      });
    }
    if (user.role === "client" && !user.isVerified) {
      return res.status(403).json({
        path: "verify",
        message:
          "Tài khoản của bạn chưa được xác minh. Vui lòng kiểm tra đường dẫn xác minh được gửi qua email.",
      });
    }
    if (user.status.toLowerCase() === "dừng hoạt động") {
      return res.status(403).json({
        path: "status",
        message: "Tài khoản của bạn đã dừng hoạt động",
      });
    }
    const isMatching = await bcrypt.compare(password, user.password);
    if (!isMatching) {
      return res.status(200).json({
        success: false,
        errors: { path: "password", msg: "Mật khẩu không chính xác!" },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        organizationName: user.organizationName,
        email: user.email,
        _id: user._id.toString(),
        role: user.role,
        avatar: user.avatar || null,
        isVerified: user.background,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Máy chủ đang gặp lỗi. Chúng tôi đang tiến hành xử lý lỗi. ",
    });
  }
};

// Refresh Token Endpoint
exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  // Optional: Kiểm tra tồn tại trong DB
  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!storedToken) {
    return res.status(403).json({ message: "Token revoked" });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
    });
    res.json({ accessToken: accessToken });
  });
};
// Logout Endpoint
exports.logout = async (req, res) => {
  const userId = req.userId;
  await RefreshToken.deleteMany({ userId });

  res.json({ message: "Logged out successfully" });
};

// reset token
// userController.js

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với email này" });
    }
    if (user.status.toLowerCase() === "dừng hoạt động") {
      return res.status(403).json({
        path: "status",
        message: "Tài khoản của bạn đã dừng hoạt động.",
      });
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set expiry
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_HOST;
    // Create reset URL
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`; // Adjust this URL to your frontend

    // Compose email message
    const message = `Bạn đã yêu cầu đặt lại mật khẩu. \n\n Vui lòng click vào đường link sau để đặt lại mật khẩu của bạn:\n\n ${resetUrl} \n\n Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Yêu cầu đặt lại mật khẩu",
        message,
      });

      res.status(200).json({
        message:
          "Một email đã được gửi đến địa chỉ email của bạn với hướng dẫn đặt lại mật khẩu.",
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: "Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Mã không hợp lệ hoặc đã hết hạn." });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword; // Assuming you're hashing the password before saving it
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mật khẩu của bạn đã được đặt lại thành công.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
