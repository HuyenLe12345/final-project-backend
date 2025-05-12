const Project = require("../models/project");
const Comment = require("../models/comment");
const User = require("../models/user");
const Donation = require("../models/donation");
const mongoose = require("mongoose");
exports.postProjectForm = async (req, res) => {
  try {
    const {
      title,
      content,
      donationType,
      moneyGoal,
      clothesGoal,
      bookGoal,
      category,
      deadline,
    } = req.body;
    const userId = req.userId;
    console.log(userId);
    const images = req.files;
    const imageUrl = [];
    for (let i = 0; i < images.length; i++) {
      imageUrl.push(images[i].path);
    }

    // tạo goals trong project
    const goals = [];
    if (moneyGoal) {
      goals.push({ form: "money", goal: moneyGoal, raised: 0 });
    }
    if (clothesGoal) {
      goals.push({ form: "clothes", goal: clothesGoal, raised: 0 });
    }
    if (bookGoal) {
      goals.push({ form: "book", goal: bookGoal, raised: 0 });
    }
    console.log(req.body, req.files);
    const project = new Project({
      title,
      category,
      content,
      images: [...imageUrl],
      goals: goals,
      types:
        donationType instanceof Array
          ? [...donationType.flat(Infinity)]
          : [donationType],
      organizationId: new mongoose.Types.ObjectId(userId),
      deadline: deadline,
      status: "Đang kêu gọi",
    });
    console.log(project);
    const newProject = await project.save();
    if (!newProject) {
      return res.status(400).json({ error: "Không hợp lệ" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// lấy thông tin chi tiết của một dự án để chỉnh sửa
exports.getProjectDetail = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log("projectId", projectId);
    const data = await Project.findById(projectId).populate("organizationId");
    console.log(data);
    const organizationData = data.organizationId;
    const address =
      organizationData.addressDetail +
      ", " +
      organizationData.ward +
      ", " +
      organizationData.district +
      ", " +
      organizationData.province;
    const organization = {
      id: organizationData._id,
      organizationName: organizationData.organizationName,
      website: organizationData.website,
      email: organizationData.email,
      address: address,
      summary: organizationData.summary,
      phone: organizationData.phone,
    };
    console.log(organization);
    const project = {
      projectId: data._id,
      title: data.title,
      content: data.content,
      category: data.category,
      images: data.images,
      goals: data.goals,
      types: data.types,
      deadline: data.deadline,
      status: data.status,
    };
    const donationByProjectId = await Donation.find({
      projectId: projectId,
      status: "confirm",
    }).select("donorName typeOfDonation anonymous raised createdAt");
    console.log(project);
    return res.status(200).json({
      success: true,
      project: project,
      organization: organization,
      donations: donationByProjectId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// lấy thông tin danh sách donation
exports.getDonationListByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 20;

    const skip = (page - 1) * count;
    const donationByProjectId = await Donation.find({
      projectId: projectId,
      status: "confirm",
    })
      .select("donorName typeOfDonation anonymous raised createdAt")
      .skip(skip)
      .limit(count);

    const totalDonation = await Donation.countDocuments({
      projectId: projectId,
      status: "confirm",
    });
    console.log(totalDonation);
    return res.status(200).json({
      success: true,
      totalDonation: totalDonation,
      donations: donationByProjectId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getDonationByName = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { searchName } = req.query;

    const donationQuery = { projectId: projectId };

    donationQuery.$and = [
      { $or: [{ donorName: { $regex: searchName, $options: "i" } }] },
      { status: "confirm" },
    ];
    const donationByName = await Donation.find(donationQuery).select(
      "donorName typeOfDonation anonymous raised createdAt"
    );

    return res.status(200).json({
      success: true,
      donations: donationByName,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// Create Comment (works for both projects and posts)
exports.createComment = async (req, res) => {
  const { contentId } = req.params;
  const { senderId, content } = req.body; // Add contentType to request body
  const { contentType } = req.query;
  console.log("contentId, contentType", req.body, req.params);
  try {
    const newComment = new Comment({
      contentId: new mongoose.Types.ObjectId(contentId),
      contentType,
      senderId: new mongoose.Types.ObjectId(senderId),
      content,
    });

    const savedComment = await newComment.save();
    console.log("savedComment", savedComment);
    return res.status(200).json({ success: true, comment: savedComment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Create Reply (works for both projects and posts)
exports.createReply = async (req, res) => {
  const { contentId } = req.params;
  const { parentId, senderId, content } = req.body;
  const { contentType } = req.query;
  console.log("reply", req.params);
  console.log("query", req.query);
  console.log("body", req.body);
  try {
    const parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      return res
        .status(404)
        .json({ message: "Bình luận mà bạn phản hồi không tồn tại" });
    }

    // Check parent comment matches content type and ID
    if (
      parentComment.contentId.toString() !== contentId.toString() ||
      parentComment.contentType !== contentType
    ) {
      return res.status(404).json({
        message: "Bình luận không thuộc về nội dung này",
      });
    }

    const newReply = new Comment({
      contentId,
      contentType,
      senderId,
      content,
      parentId,
    });

    await newReply.save();
    return res.status(200).json({ success: true, reply: newReply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Get Comments (generic for any content type)
exports.getCommentsByContent = async (req, res) => {
  const { contentId } = req.params;
  const { contentType } = req.query; // Get content type from query params
  console.log(contentType);
  try {
    const comments = await Comment.find({ contentId, contentType }).populate(
      "senderId",
      "username organizationName avatar"
    );

    // Organize comments into parent-child structure
    const commentMap = {};
    const organizedComments = [];

    // First pass - create map and top-level comments
    comments.forEach((comment) => {
      if (!comment.parentId) {
        organizedComments.push({
          comment: formatComment(comment),
          replies: [],
        });
      }
      commentMap[comment._id] = comment;
    });

    // Second pass - add replies
    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId];
        if (parent) {
          const parentInArray = organizedComments.find((c) =>
            c.comment._id.equals(parent._id)
          );
          if (parentInArray) {
            parentInArray.replies.push(formatComment(comment));
          }
        }
      }
    });

    return res.status(200).json({ success: true, comments: organizedComments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Toggle Like (remains mostly the same)
exports.toggleLikeComment = async (req, res) => {
  const { commentId, userId } = req.body;
  console.log("comMENT , USERiD", req.body);
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ message: "Bình luận mà bạn thích không còn tồn tại" });
    }

    const isLiked = comment.likes.some(
      (like) => like.toString() === userId.toString()
    );
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedComment = await Comment.findByIdAndUpdate(commentId, update, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: updatedComment.likes.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Helper function to format comment
function formatComment(comment) {
  return {
    ...comment.toJSON(),
    username:
      comment.senderId?.username || comment.senderId?.username || "Ẩn danh",
    avatar: comment.senderId?.avatar || null,
    likesCount: comment.likes.length,
  };
}

exports.getProjectDetailToEdit = async (req, res) => {
  console.log("hello");
  const { projectId } = req.params;

  console.log("projectId", projectId);
  const userId = req.userId;
  console.log("userId", userId);
  try {
    const user = await User.findById(userId).select("role");
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });
    }
    console.log("project", project);
    if (
      user.role === "partner" &&
      project.organizationId.toString() === userId.toString()
    ) {
      return res.status(200).json({ success: true, project });
    } else if (user.role === "admin 1" || user.role === "admin 2") {
      const organizationName = await User.findById(
        project.organizationId
      ).select("organizationName");
      console.log("organizationName", organizationName);
      return res.status(200).json({ success: true, project, organizationName });
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.updateProjectDetail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content, category, deadline, status } = req.body;
    console.log(projectId, title, req.body);
    const images = req.files;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Dự án không được tìm thấy!" });
    }
    if (images.length > 0) {
      const imageUrl = [];
      for (let i = 0; i < images.length; i++) {
        imageUrl.push(images[i].path);
      }
      project.images = [...imageUrl];
    }
    project.title = title;
    project.content = content;
    project.category = category;
    project.status = status;
    if (deadline) {
      project.deadline = deadline;
    }
    await project.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.postDonationInfo = async (req, res) => {
  try {
    const {
      donorName,
      email,
      phone,
      address,
      typeOfDonation,
      registeredTransport,
      money,
      clothes,
      book,
      userId,
      anonymous,
    } = req.body;

    const { projectId } = req.params;

    console.log(projectId);
    // Fetch project and organization details
    const project = await Project.findById(projectId).populate(
      "organizationId",
      "linkQR"
    );
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án!" });
    }

    const organization = project.organizationId;
    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy tổ chức!" });
    }
    const transactionCode = `DON${Date.now()}`; // Generate a unique transaction code
    const linkQR = organization.linkQR;
    console.log("linkQR, transactionCode");
    // Save the donation
    const donation = new Donation({
      donorName,
      email,
      address,
      typeOfDonation,
      registered: money || clothes || book,
      transactionCode,
      anonymous: anonymous === "on" ? true : false,
      projectId,
      donorId: userId,
      phone: phone || null,
    });
    if (registeredTransport) {
      donation.registeredTransport = registeredTransport;
    }
    await donation.save();
    console.log("save donation");
    if (typeOfDonation === "money") {
      console.log("money");
      return res.status(200).json({
        success: true,
        transactionCode,
        linkQR,
        donationId: donation._id,
      });
    }
    console.log("khác money");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.deleteDonationInfo = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findByIdAndDelete(donationId);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "Đang kêu gọi" })
      .populate({ path: "organizationId", select: "organizationName avatar" })
      .select("title goals status category images deadline createdAt")
      .sort({ createdAt: -1 });
    console.log("projects");

    const organizations = await User.find({ role: "partner" }).select(
      "organizationName"
    );
    console.log("return", organizations);
    return res
      .status(200)
      .json({ success: true, projects: projects, organizations });
  } catch (error) {
    console.log("active Project", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getInactiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "Kết thúc" })
      .populate({ path: "organizationId", select: "organizationName" })
      .select("title goals status category images deadline createdAt");

    const organizations = await User.find({ role: "partner" }).select(
      "organizationName"
    );
    console.log("return", organizations);
    return res
      .status(200)
      .json({ success: true, projects: projects, organizations });
  } catch (error) {
    console.log("inactive Project", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// tải tất cả các dự án
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().select("title");
    return res.status(200).json({ success: true, projectList: projects });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
