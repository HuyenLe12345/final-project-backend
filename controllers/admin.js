const Project = require("../models/project");
const Post = require("../models/post");
const User = require("../models/user");
const Donation = require("../models/donation");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");
const { emailTemplate } = require("../utils/emailTemplate");
const formatDonationValue = require("../utils/toVND");
const moment = require("moment");
const mongoose = require("mongoose");

exports.getTotalInfo = async (req, res) => {
  try {
    // đếm số dự án
    const projectNumber = await Project.countDocuments();
    // tìm các dự án mới nhất
    const recentProjects = await Project.find({})
      .select("title status category deadline")
      .sort({ createdAt: -1 })
      .limit(10);
    //  tìm các dự án sắp hết hạn trong 1 tuần
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const expiringProjects = await Project.find({
      deadline: {
        $gte: now.toISOString(), // Deadline is greater than or equal to now
        $lte: soon.toISOString(), // Deadline is less than or equal to 7 days from now
      },
    }).select("title category goals deadline");
    // tìm số lượng bài viết
    const postNumber = await Post.countDocuments();
    // tìm số lượng người dùng là clients
    const clientNumber = await User.countDocuments({ role: "client" });
    // tìm số lương partner
    const partnerNumber = await User.countDocuments({ role: "partner" });
    console.log(expiringProjects);
    // tìm lượt ủng hộ
    const moneySupports = await Donation.countDocuments({
      typeOfDonation: "money",
    });
    const clothesSupports = await Donation.countDocuments({
      typeOfDonation: "clothes",
    });
    const bookSupports = await Donation.countDocuments({
      typeOfDonation: "book",
    });
    const total = moneySupports + clothesSupports + bookSupports;
    const amount = await Donation.aggregate([
      {
        $group: {
          _id: "$typeOfDonation",
          totalMoney: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "money"] }, "$raised", 0],
            },
          },
          totalClothes: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "clothes"] }, "$raised", 0],
            },
          },
          totalBooks: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "book"] }, "$raised", 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          moneyDonations: { $sum: "$totalMoney" },
          clothesDonations: { $sum: "$totalClothes" },
          bookDonations: { $sum: "$totalBooks" },
        },
      },
    ]);
    console.log("amount", amount[0]);
    return res.status(200).json({
      success: true,
      totalInfo: {
        projectNumber,
        recentProjects,
        expiringProjects,
        postNumber,
        clientNumber,
        partnerNumber,
        supports: { total, moneySupports, clothesSupports, bookSupports },
        amount: {
          money: amount[0]?.moneyDonations,
          clothes: amount[0]?.clothesDonations,
          books: amount[0]?.bookDonations,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// lấy user theo type (client/ senior)
exports.getUsersByType = async (req, res) => {
  try {
    const {
      type,
      page,
      count,
      searchStatus,
      searchContent,
      searchTypeOfSenior,
    } = req.query;
    console.log(req.query);
    const pageNumber = parseInt(page, 10);
    const countNumber = parseInt(count, 10);
    const skip = (pageNumber - 1) * countNumber;
    const userQuery = {
      status: searchStatus === "active" ? "hoạt động" : "dừng hoạt động",
    };
    if (type === "client") {
      userQuery.role = type;
    }
    if (type === "senior" && searchTypeOfSenior) {
      if (searchTypeOfSenior === "partner") {
        userQuery.role = "partner";
      } else {
        userQuery.role = { $in: ["admin 1", "admin 2"] };
      }
    }
    if (type === "client" && searchContent) {
      userQuery.$or = [
        { username: { $regex: searchContent.toLowerCase(), $options: "i" } },
        { email: { $regex: searchContent.toLowerCase(), $options: "i" } },
      ];
    }
    if (type === "senior" && searchContent) {
      if (searchTypeOfSenior.toLowerCase() === "partner") {
        userQuery.$or = [
          {
            organizationName: {
              $regex: searchContent.toLowerCase(),
              $options: "i",
            },
          },
          { email: { $regex: searchContent.toLowerCase(), $options: "i" } },
        ];
      } else if (searchTypeOfSenior.toLowerCase() === "admin") {
        console.log(searchTypeOfSenior);
        userQuery.$or = [
          { username: { $regex: searchContent.toLowerCase(), $options: "i" } },
          { email: { $regex: searchContent.toLowerCase(), $options: "i" } },
        ];
      }
    }

    const users = await User.find(userQuery).skip(skip).limit(count);
    console.log("users");
    return res.status(200).json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error("Lỗi tải danh sách ", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// lấy users
exports.getUsers = async (req, res) => {
  const { page, count } = req.query;
  // Convert page and count to numbers
  const pageNumber = parseInt(page, 10);
  const countNumber = parseInt(count, 10);
  const skip = (pageNumber - 1) * countNumber;
  try {
    const users = await User.find({ role: "client" })
      .skip(skip) // Skip the documents based on the current page
      .limit(countNumber); // Limit the number of documents returned

    return res.status(200).json({ success: true, users: users });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getPartners = async (req, res) => {
  const { page, count } = req.query;
  const pageNumber = parseInt(page, 10);
  const countNumber = parseInt(count, 10);
  const skip = (pageNumber - 1) * countNumber;
  try {
    const partners = await User.find({ role: "partner" })
      .skip(skip) // Skip the documents based on the current page
      .limit(countNumber); // Limit the number of documents returned
    console.log(partners);
    return res.status(200).json({ success: true, partners });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getAdmins = async (req, res) => {
  const { page, count } = req.query;
  const pageNumber = parseInt(page, 10);
  const countNumber = parseInt(count, 10);
  const skip = (pageNumber - 1) * countNumber;
  try {
    const admins = await User.find({ role: { $in: ["admin 1", "admin 2"] } })
      .skip(skip) // Skip the documents based on the current page
      .limit(countNumber); // Limit the number of documents returned
    console.log(admins);
    return res.status(200).json({ success: true, admins });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "client" });
    console.log("totalUsers", totalUsers);
    return res.status(200).json({ success: true, totalUsers });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getTotalPartners = async (req, res) => {
  try {
    const totalPartners = await User.countDocuments({ role: "partner" });
    console.log("totalPartners", totalPartners);
    return res.status(200).json({ success: true, totalPartners });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getTotalAdmins = async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({
      role: { $in: ["admin 1", "admin 2"] },
    });
    console.log("totalAdmins", totalAdmins);
    return res.status(200).json({ success: true, totalAdmins });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId;
    const admin = await User.findById(adminId).select("role");
    const user = await User.findById(userId).select("role");
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng theo id này" });
    }
    if (user.role === "client") {
      await User.findByIdAndDelete(userId);
    } else if (user.role === "admin 2" && admin.role === "admin 1") {
      await User.findByIdAndDelete(userId);
    } else if (user.role === "admin 2" && admin.role === "admin 2") {
      return res.status(403).json({ message: "Bạn không được cấp quyền" });
    }

    await Post.deleteMany({ authorId: new mongoose.Types.ObjectId(userId) });
    return res
      .status(200)
      .json({ success: true, message: "Xoá người dùng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.editProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    return res.status(200).json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// tạo tài khoản admin hoặc partner
exports.createAccountAdmin = async (req, res) => {
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

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "admin 2",
      status: "hoạt động",
      isVerified: true,
    });

    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
//tạo tài khoản partner
exports.createAccountPartner = async (req, res) => {
  try {
    const {
      email,
      password,
      confirm,
      organizationName,
      province,
      district,
      ward,
      addressDetail,
      phone,
      website,
    } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      console.log("errors", errors);
      return res.status(400).json({ errors: errors });
    }
    console.log("file", req.files);

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      organizationName: organizationName.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: "partner",
      phone,
      province,
      district,
      ward,
      addressDetail,
      status: "hoạt động",
      isVerified: true,
      website: website,
      linkQR: req.files[0].path,
      avatar: req.files[1].path,
      background: req.files[2].path,
    });

    await user.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error); // Log the actual error
    return res.status(500).json({
      message: "Lỗi máy chủ",
    });
  }
};

exports.getDonationList = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("role");
    const query = req.query;

    const page = parseInt(query.page) || 1;
    const count = parseInt(query.count) || 20;
    console.log("org, query, page, count");
    // Xử lý các bộ lọc khác như status, searchDate, searchContent, typeOfDonation, projectName
    const status = query.status;
    const searchDate = query.searchDate;
    const searchContent = query.searchContent;
    const typeOfDonation = query.typeOfDonation;
    const projectName = query.projectName;
    const organization = query.organization;
    const organizationId = query.organizationId;
    const skip = (page - 1) * count;
    const limit = count;
    const donationQuery = {};

    if (user.role === "partner" && organizationId) {
      const projects = await Project.find({ organizationId }, { _id: 1 });

      donationQuery.projectId = { $in: projects.map((project) => project._id) };
    }
    if ((user.role === "admin 1" || user.role === "admin 1") && organization) {
      const projects = await Project.find({
        organizationId: new mongoose.Types.ObjectId(organization),
      });
      donationQuery.projectId = { $in: projects.map((project) => project._id) };
    }

    // Áp dụng các bộ lọc
    if (status) {
      donationQuery.status = status;
    }
    if (searchDate) {
      const startDate = moment.utc(searchDate).startOf("day");
      const endDate = moment.utc(searchDate).endOf("day");

      donationQuery.createdAt = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      };
      console.log("startDate", startDate);
      console.log("endDate", endDate);
    }

    if (searchContent) {
      donationQuery.$or = [
        { donorName: { $regex: searchContent, $options: "i" } },
        { typeOfDonation: { $regex: searchContent, $options: "i" } },
        { transactionCode: { $regex: searchContent, $options: "i" } },
        { email: { $regex: searchContent, $options: "i" } },
      ];
    }

    if (typeOfDonation) {
      donationQuery.typeOfDonation = typeOfDonation;
    }

    if (projectName) {
      const project = await Project.findById(projectName);
      if (project) {
        donationQuery.projectId = project._id;
      }
    }
    console.log("donationQuery", donationQuery);
    const donations = await Donation.find(donationQuery)
      .populate({ path: "projectId", select: "title" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    console.log("donations", donations);
    const totalCount = await Donation.countDocuments(donationQuery);
    console.log(donations);
    res.status(200).json({
      success: true,
      donationList: donations,
      totalCount,
    });
  } catch (error) {
    console.error("Lỗi tải danh sách quyên góp:", error);
    res.status(500).json({
      message: "Lỗi máy chủ",
    });
  }
};
exports.updateDonation = async (req, res) => {
  try {
    const { donationIds, action, exact } = req.body; // Nhận array IDs và hành động (confirm/reject)
    const { reasonForRejection } = req.body;
    console.log("donation", donationIds, action);
    if (!donationIds || !Array.isArray(donationIds)) {
      return res.status(400).json({
        success: false,
        message: "Danh sách ID quyên góp không hợp lệ",
      });
    }

    const results = {
      success: [],
      errors: [],
    };

    // Xử lý từng donation song song
    await Promise.all(
      donationIds.map(async (donationId) => {
        try {
          const donation = await Donation.findById(donationId);
          if (!donation) {
            results.errors.push({
              id: donationId,
              message: "Không tìm thấy quyên góp",
            });
            return;
          }

          // Validate project và organization (giữ nguyên logic cũ)
          const project = await Project.findById(donation.projectId);
          if (!project) {
            results.errors.push({
              id: donationId,
              message: "Không tìm thấy dự án liên quan",
            });
            return;
          }

          // Cập nhật trạng thái
          donation.status =
            action === "confirm" || action === "correct" ? "confirm" : "reject";
          if (action === "reject" && reasonForRejection) {
            donation.reasonForRejection = reasonForRejection;
          }
          await donation.save();
          // Xử lý mục tiêu dự án nếu confirm
          if (action === "confirm" || action === "correct") {
            if (exact) {
              donation.raised = exact;
            } else {
              donation.raised = donation.registered;
            }
            await donation.save();
            const typeOfDonation = donation.typeOfDonation;
            console.log("typeOfDonation");
            project.goals = project.goals.map((goal) => {
              if (goal.form === typeOfDonation) {
                goal.raised =
                  parseInt(goal.raised || 0) + parseInt(donation.raised);
              }
              return goal;
            });
            await project.save();
          }

          // Gửi email
          const organization = await User.findById(
            project.organizationId
          ).select("organizationName");
          const organizationName = organization.organizationName;
          sendEmail({
            email: donation.email,
            subject:
              action === "confirm" || action === "correct"
                ? "Thư cảm ơn"
                : "Thư từ chối",
            html: emailTemplate({
              action,
              donation,
              organizationName,
              project,
              reasonForRejection,
              formatDonationValue,
            }),
            attachments: [
              {
                filename: "logoweb.png",
                path: "http://localhost:8080/images/logoweb.png", // Đường dẫn tuyệt đối đến hình ảnh
                cid: "logo", // ID để tham chiếu trong HTML
              },
            ],
          });
          console.log("Email đã được gửi thành công.");
        } catch (error) {
          console.log("lỗi email", error);
          results.errors.push({
            id: donationId,
            message: error.message,
          });
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: `Đã xử lý ${results.success.length} quyên góp thành công`,
      details: {
        successCount: results.success.length,
        errorCount: results.errors.length,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

// tải danh sách project theo tổ chức
exports.getProjectList = async (req, res) => {
  try {
    const organizationId = req.params.organizationId;
    const projects = await Project.find({ organizationId }).select("title");
    console.log(projects);
    res.json({
      success: true,
      projectList: projects,
    });
  } catch (error) {
    console.error("Lỗi tải dự án:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

// lấy dữ liệu tổng quát của tổ chức.
exports.getTotalStatsForHomePage = async (req, res) => {
  try {
    console.log("first step");
    const projects = await Project.countDocuments({
      status: "Đang kêu gọi",
    });
    const posts = await Post.countDocuments();
    const organizations = await User.countDocuments({ role: "partner" });
    const supports = await Donation.countDocuments({ status: "confirm" });
    const amount = await Donation.aggregate([
      {
        $group: {
          _id: "$typeOfDonation",
          totalMoney: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "money"] }, "$raised", 0],
            },
          },
          totalClothes: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "clothes"] }, "$raised", 0],
            },
          },
          totalBooks: {
            $sum: {
              $cond: [{ $eq: ["$typeOfDonation", "book"] }, "$raised", 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          moneyDonations: { $sum: "$totalMoney" },
          clothesDonations: { $sum: "$totalClothes" },
          bookDonations: { $sum: "$totalBooks" },
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      stats: [
        { label: "Dự án", number: projects },
        { label: "Bài viết", number: posts },
        { label: "Tổ chức", number: organizations },
        { label: "Lượt ủng hộ", number: supports },
        { label: "Ủng hộ tiền", number: amount[0]?.moneyDonations },
        { label: "Ủng hộ quần áo", number: amount[0]?.clothesDonations },
        { label: "Ủng hộ sách", number: amount[0]?.bookDonations },
      ],
    });
  } catch (error) {
    console.log("getTotalStat", error);
    return res.status(500).json({
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

// lấy logo các đối tác hợp tác
exports.getPartnerLogos = async (req, res) => {
  try {
    const avatar = await User.find({ role: "partner" }).select(
      "organizationName avatar"
    );
    if (!avatar) {
      return res.status(404).json({ message: "Không tìm thấy" });
    } else {
      return res.status(200).json({ success: true, logos: avatar });
    }
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
//LẤY 10 DONATIONS mới nhất
exports.getTenDonations = async (req, res) => {
  try {
    console.log("step 1");
    const donations = await Donation.find()
      .populate("projectId", "title")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("10 donation", donations);
    return res.status(200).json({ success: true, donations: donations });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getDonationsByMonthAndYear = async (req, res) => {
  try {
    const { date } = req.query;

    const parsedDate = moment(date, "YYYY-MM");
    console.log(parsedDate);
    if (!parsedDate.isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM." });
    }

    // Create date range for the month
    const startDate = parsedDate.startOf("month").toDate();
    const endDate = parsedDate.endOf("month").toDate();

    // Query the database
    const donations = await Donation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            typeOfDonation: "$typeOfDonation",
          },
          total: { $sum: { $ifNull: ["$raised", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          type: "$_id.typeOfDonation",
          total: 1,
        },
      },
      {
        $group: {
          _id: "$date",
          money: {
            $sum: {
              $cond: [{ $eq: ["$type", "money"] }, "$total", 0],
            },
          },
          clothes: {
            $sum: {
              $cond: [{ $eq: ["$type", "clothes"] }, "$total", 0],
            },
          },
          books: {
            $sum: {
              $cond: [{ $eq: ["$type", "book"] }, "$total", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          money: { $ifNull: ["$money", 0] },
          clothes: { $ifNull: ["$clothes", 0] },
          books: { $ifNull: ["$books", 0] },
        },
      },
      { $sort: { date: 1 } },
    ]);
    console.log({ donation: donations[0] });
    return res.status(200).json({ success: true, donation: donations[0] });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
