const express = require("express");
const User = require("../models/user");
const projectController = require("../controllers/project");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.get("/active", projectController.getActiveProjects);
router.get("/inactive", projectController.getInactiveProjects);
router.get("/all", projectController.getAllProjects);
router.post(
  "/project-form",
  checkAuth.checkPartnerAndAdmin,
  projectController.postProjectForm
);
router.get(
  "/:projectId/donations",
  projectController.getDonationListByProjectId
);
router.get("/:projectId/donationByName", projectController.getDonationByName);
router.get("/:projectId", projectController.getProjectDetail);
router.get("/:contentId/comments", projectController.getCommentsByContent);
router.post(
  "/:contentId/comments/create",
  checkAuth.checkAuth,
  projectController.createComment
);
router.post(
  "/:contentId/comments/reply",
  checkAuth.checkAuth,
  projectController.createReply
);
router.post(
  "/comments/like",
  checkAuth.checkAuth,
  projectController.toggleLikeComment
);
router.delete("/donations/:donationId", projectController.deleteDonationInfo);
router.post("/:projectId/donate", projectController.postDonationInfo);
router.get(
  "/edit/:projectId",
  checkAuth.checkPartnerAndAdmin,
  projectController.getProjectDetailToEdit
);
router.post(
  "/update/:projectId/",
  checkAuth.checkPartnerAndAdmin,
  projectController.updateProjectDetail
);

module.exports = router;
