const express = require("express");

const { body } = require("express-validator");
const User = require("../models/user");
const authController = require("../controllers/auth");
const userController = require("../controllers/user");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

// HANDLE TASK "SIGN UP"
router.post(
  "/auth/signup",
  [
    body("email", "Hãy nhập email hợp lệ!")
      .isEmail()
      .normalizeEmail()
      .trim()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(
              "Email này đã tồn tại. Vui lòng kiểm tra lại."
            );
          }
        });
      }),
    body("username")
      .trim()
      .custom((value) => {
        const lowerValue = value.toLowerCase();
        return User.findOne({
          $or: [
            { username: { $regex: `^${lowerValue}$`, $options: "i" } },
            { organizationName: { $regex: `^${lowerValue}$`, $options: "i" } },
          ],
        }).then((user) => {
          if (user) {
            return Promise.reject("Tên sử dụng đã tồn tại. Hãy thử tên khác.");
          }
        });
      }),
    body(
      "password",
      "Mật khẩu của bạn phải bao gồm ít nhất 8 kí tự chữ và/hoặc số."
    )
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 }),
    body("confirm", "Mật khẩu của bạn không khớp")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 })
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Mật khẩu của bạn không khớp!");
        }
        return true;
      }),
  ],
  authController.postSignUp
);

router.get("/auth/verify-email/:token", authController.verifyEmail);
router.post("/auth/refresh-token", authController.refreshToken);
router.post(
  "/auth/signin",

  body("email", "Hãy nhập email hợp lệ!").isEmail().normalizeEmail(),

  authController.postSignin
);
router.delete("/auth/logout", checkAuth.checkAuth, authController.logout);
router.get("/:userId/stats", userController.getStats);
router.get(
  "/donation-activities/:userId",
  userController.getDonationActivities
);
router.get("/:userId/projects", userController.getProjectByUserId);
router.get("/:userId/posts", userController.getPostById);
router.patch("/:userId/upload", userController.uploadImage);
router.get(
  "/personal-info",
  checkAuth.checkAuth,
  userController.getPersonalInfo
);
router.get("/personal-info/:userId", userController.getProfile);
// router.get("/personal-info/:userId", userController.getPersonalInfo);
router.post(
  "/personal-info/:userId/update",
  checkAuth.checkAuth,
  userController.updatePersonalInfo
);
router.get("/provinces", userController.getProvinces);
router.post("/districts", userController.postDistrictsByProvince);
router.post("/wards", userController.postWardsByDistrict);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password/:token", authController.resetPassword);
router.get("/organizations", userController.getAllOrganizations);
module.exports = router;
