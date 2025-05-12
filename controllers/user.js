const Province = require("../models/province");
const Project = require("../models/project");
const User = require("../models/user");
const Post = require("../models/post");
const Donation = require("../models/donation");
const mongoose = require("mongoose");
// lấy danh sách các tỉnh thành phường
exports.getProvinces = async (req, res) => {
  try {
    const provincesList = await Province.find({}).select("name").exec();
    const provinces = provincesList.map((pro) => {
      return { id: pro._id, value: pro.name, label: pro.name };
    });
    console.log("provinces", provinces);
    return res.status(200).json({ success: true, data: provinces });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.postDistrictsByProvince = async (req, res) => {
  const { value } = req.body;
  console.log("chosenProvince", req.body);
  try {
    const districtList = await Province.findOne({ name: value })
      .select("districts")
      .exec();
    const districts = districtList.districts.map((dis) => {
      return { id: dis._id, value: dis.name, label: dis.name };
    });
    console.log(districts);
    return res.status(200).json({ success: true, data: districts });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.postWardsByDistrict = async (req, res) => {
  const { provinceName, districtName } = req.body;
  try {
    const districtList = await Province.findOne({ name: provinceName })
      .select("districts")
      .exec();
    console.log("districtList", districtList);
    const chosenDistrict = districtList.districts.find(
      (dis) => dis.name === districtName
    );
    console.log("chosenDistrict", chosenDistrict);
    const wards = chosenDistrict.wards.map((ward) => {
      return { id: ward._id, value: ward.name, label: ward.name };
    });

    console.log("wards", wards);
    return res.status(200).json({ success: true, data: wards });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// lấy thông tin cá nhân
exports.getPersonalInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;
    console.log("type", type);
    let user;
    if (type === "profile") {
      user = await User.findById(userId).select(
        "username email fullname role organizationName gender province district ward addressDetail phone summary status linkQR website"
      );
    }
    if (type === "images") {
      user = await User.findById(userId).select(
        "username role organizationName avatar background"
      );
    }

    if (user) {
      console.log("user", user);
      return res.status(200).json({ success: true, data: user });
    } else {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ).select(
      "username avatar background email fullname role organizationName gender province district ward addressDetail phone summary status linkQR website"
    );

    if (user) {
      console.log("user", user);
      return res.status(200).json({ success: true, data: user });
    } else {
      return res.status(404).json({ message: "Người dùng này không tồn tại" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// CẬP NHẬT THÔNG TIN CÁ NHÂN
exports.updatePersonalInfo = async (req, res) => {
  try {
    const {
      username,
      fullname,
      gender,
      organizationName,
      province,
      district,
      ward,
      addressDetail,
      phone,
      summary,
      userId,
      status,
      website,
    } = req.body;

    let lowerValue;
    if (username) {
      lowerValue = username.toLowerCase().trim();
    } else if (organizationName) {
      lowerValue = organizationName.toLowerCase().trim();
    }
    const checkUnique = await User.findOne({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: `^${lowerValue}$`, $options: "i" } },
        { organizationName: { $regex: `^${lowerValue}$`, $options: "i" } },
      ],
    });
    if (checkUnique) {
      if (username) {
        return res
          .status(200)
          .json({ success: false, message: "Tên người dùng bị trùng lặp." });
      } else if (organizationName) {
        return res
          .status(200)
          .json({ success: false, message: "Tên tổ chức bị trùng lặp." });
      }
    }
    const user = await User.findById(userId);
    console.log("user", user);
    if (user.role === "client" || user.role === "admin") {
      user.username = username.trim();
      user.fullname = fullname.trim();
      user.gender = gender.trim();
    }

    user.province = province;
    user.district = district;
    user.ward = ward;
    user.addressDetail = addressDetail.trim();
    user.phone = phone.trim();

    if (user.role === "partner") {
      user.website = website;
      user.summary = summary;
      user.organizationName = organizationName.trim();
    }
    console.log(req.files);
    console.log("Chuẩn bị xét files ảnh");
    if (req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const image = req.files[i];
        if (image.fieldname === "linkQR") {
          user.linkQR = image.path;
        } else if (image.fieldname === "avatar") {
          user.avatar = image.path;
        } else if (image.fieldname === "background") {
          user.background = image.path;
        }
      }
    }

    if (status) {
      user.status = status;
    }
    console.log("status");
    const updatedUser = await user.save();
    console.log(updatedUser);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error); // Log the actual error
    return res.status(500).json({
      message: "Lỗi máy chủ",
    });
  }
};
exports.getStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "partner") {
      // 1. Tìm số lượng dự án khác nhau mà partner đã thực hiện
      const uniqueProjects = await Project.find(
        { organizationId: userId },
        { _id: 1 }
      );
      const projectsCount = uniqueProjects.length;

      // 2. Tìm tổng số hỗ trợ cho tất cả dự án của partner
      const totalSupports = await Donation.countDocuments({
        projectId: { $in: uniqueProjects.map((p) => p._id) },
      });

      // 3. Tính tổng tiền, quần áo, sách qua tất cả dự án của partner
      const donationStats = await Donation.aggregate([
        {
          $match: {
            projectId: { $in: uniqueProjects.map((p) => p._id) },
          },
        },
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

      const stats = donationStats[0] || {
        moneyDonations: 0,
        clothesDonations: 0,
        bookDonations: 0,
      };

      // 4. Tìm số lượng bài viết của partner
      const postsCount = await Post.countDocuments({ authorId: userId });

      return res.status(200).json({
        success: true,
        stats: {
          projectsCount,
          totalSupports,
          moneyDonations: stats.moneyDonations,
          clothesDonations: stats.clothesDonations,
          bookDonations: stats.bookDonations,
          postsCount,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      });
    } else if (user.role === "client") {
      // 1. Tìm số lượng bài viết của client
      const postsCount = await Post.countDocuments({ authorId: userId });

      // 2. Tìm số lượng dự án khác nhau mà client đã quyên góp
      const uniqueProjects = await Donation.aggregate([
        {
          $match: {
            donorId: new mongoose.Types.ObjectId(userId),
            status: "confirm",
          },
        },
        {
          $group: {
            _id: "$projectId",
          },
        },
        {
          $count: "count",
        },
      ]);
      const projectsSupportedCount = uniqueProjects[0]?.count || 0;

      // 3. Tính tổng tiền, quần áo, sách mà client đã quyên góp
      const donationStats = await Donation.aggregate([
        {
          $match: {
            donorId: new mongoose.Types.ObjectId(userId), // Sửa đổi ở đây
          },
        },
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

      const stats = donationStats[0] || {
        moneyDonations: 0,
        clothesDonations: 0,
        bookDonations: 0,
      };

      return res.status(200).json({
        success: true,
        stats: {
          postsCount,
          projectsSupportedCount,
          moneyDonations: stats.moneyDonations,
          clothesDonations: stats.clothesDonations,
          bookDonations: stats.bookDonations,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: " Lỗi máy chủ" });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const { type } = req.query;
    console.log(type);
    const { userId } = req.params;
    let image;
    if (req.files.length > 0) {
      image = req.files[0].path;
    }
    const user = await User.findById(userId);

    if (image && type === "avatar") {
      user.avatar = image;
    } else if (image && type === "background") {
      user.background = image;
    }
    await user.save();
    return res.status(200).json({ success: true, image: image });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getProjectByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    console.log(userId, status);
    let projects;
    const user = await User.findById(userId);
    if (user.role === "client") {
      console.log("client");
      const donation = await Donation.find({
        donorId: new mongoose.Types.ObjectId(user._id),
        status: "confirm",
      }).select("projectId");
      const projectIds = donation.map((donat) => donat.projectId);
      console.log("donation", projectIds);

      projects = await Project.find({ _id: { $in: projectIds } }).populate({
        path: "organizationId",
        select: "organizationName avatar",
      });
    } else if (user.role === "partner") {
      if (status === "active") {
        projects = await Project.find({
          organizationId: new mongoose.Types.ObjectId(userId),
          status: "Đang kêu gọi",
        })
          .populate({
            path: "organizationId",
            select: "organizationName avatar",
          })
          .select("title goals status category images deadline createdAt")
          .sort({ createdAt: -1 }); // Thêm dòng này để sắp xếp;
      } else if (status === "inactive") {
        console.log("status");
        projects = await Project.find({
          organizationId: new mongoose.Types.ObjectId(userId),
          status: "Kết thúc",
        })
          .populate({
            path: "organizationId",
            select: "organizationName avatar",
          })
          .select("title goals status category images deadline createdAt")
          .sort({ createdAt: -1 }); // Thêm dòng này để sắp xếp;
      }
    }

    console.log(projects);
    return res.status(200).json({ success: true, projects });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getPostById = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({
      authorId: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: "authorId",
        select: "avatar username organizationName role",
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, posts: posts });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// lấy thông tin donation của user theo userid
exports.getDonationActivities = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId);
    const activities = await Donation.find({
      donorId: new mongoose.Types.ObjectId(userId),
    })
      .populate({ path: "projectId", select: "title" })
      .select("projectId typeOfDonation registered raised status createdAt")
      .sort({ createdAt: -1 });

    if (!activities) {
      return res.status(404).json({ message: "Không tìm thấy hoạt động nào" });
    }
    console.log(activities);
    return res.status(200).json({
      success: true,
      donationActivities: activities,
    });
  } catch (error) {
    console.error("Lỗi lấy hoạt động:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// tải danh sách các tổ chức
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await User.find({ role: "partner" }).select(
      "organizationName"
    );
    return res
      .status(200)
      .json({ success: true, organizationList: organizations });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
