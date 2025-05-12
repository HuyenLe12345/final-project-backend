const express = require("express");
const adminController = require("../controllers/admin");
const { body } = require("express-validator");
const User = require("../models/user");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

router.get("/get/total-stats", adminController.getTotalStatsForHomePage);

router.get("/get/logos", adminController.getPartnerLogos);
router.get(
  "/get/user-total",
  checkAuth.checkAdmin,
  adminController.getTotalUsers
);
router.get(
  "/get/partner-information",
  checkAuth.checkAdmin,
  adminController.getPartners
);
router.get(
  "/get/partner-total",
  checkAuth.checkAdmin,
  adminController.getTotalPartners
);
router.get(
  "/get/admin-total",
  checkAuth.checkDefaultAdmin,
  adminController.getTotalAdmins
);
router.get(
  "/get/admin-information",
  checkAuth.checkDefaultAdmin,
  adminController.getAdmins
);
router.get(
  "/get/all-donation",
  checkAuth.checkPartnerAndAdmin,
  adminController.getDonationList
);
router.get("/get/recentDonations", adminController.getTenDonations);
router.get("/get/donationByDate", adminController.getDonationsByMonthAndYear);
router.get("/", adminController.getTotalInfo);
router.delete(
  "/delete/users/:userId",
  checkAuth.checkAdmin,
  adminController.deleteUser
);
router.get("/:projectId/edit", adminController.editProject);
router.post(
  "/create-account/admin",
  checkAuth.checkDefaultAdmin,
  [
    body("email", "Hãy nhập email hợp lệ.")
      .isEmail()
      .normalizeEmail()
      .trim()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email này đã tồn tại.");
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
            return Promise.reject(
              "Tên người dùng đã tồn tại. Hãy thử tên khác."
            );
          }
        });
      }),

    body("password", "Mật khẩu của bạn phải có ít nhất 8 kí tự chữ và/hoặc số.")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 }),
    body("confirm", "Mật khẩu không khớp.")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 })
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Mật khẩu không khớp.");
        }
        return true;
      }),
  ],
  adminController.createAccountAdmin
);
router.post(
  "/create-account/partner",
  checkAuth.checkAdmin,
  [
    body("email", "Hãy nhập email hợp lệ.")
      .isEmail()
      .trim()
      .normalizeEmail()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email này đã tồn tại.");
          }
        });
      }),
    body("organizationName")
      .trim()
      .custom((value) => {
        console.log("organizationName", value);
        const lowerValue = value.toLowerCase();
        console.log(lowerValue);
        return User.findOne({
          $or: [
            { username: { $regex: `^${lowerValue}$`, $options: "i" } },
            { organizationName: { $regex: `^${lowerValue}$`, $options: "i" } },
          ],
        }).then((user) => {
          if (user) {
            return Promise.reject("Tên tổ chức đã tồn tại. Hãy thử tên khác.");
          }
        });
      }),
    body("password", "Mật khẩu của bạn phải có ít nhất 8 kí tự chữ và/hoặc số.")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 }),
    body("confirm", "Mật khẩu không khớp.")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 })
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Mật khẩu không khớp.");
        }
        return true;
      }),
  ],
  adminController.createAccountPartner
);

router.get("/get/user-information", adminController.getUsersByType);

router.put("/donations", adminController.updateDonation);
router.get("/projects/:organizationId", adminController.getProjectList);

module.exports = router;
