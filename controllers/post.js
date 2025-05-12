const Post = require("../models/post");
const User = require("../models/user");
exports.createPost = async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const images = [];
    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].path);
      }
    }
    const post = new Post({
      title: title,
      content: content,
      authorId: userId,
      images: images,
    });
    await post.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.getPostDetail = async (req, res) => {
  try {
    const { postId } = req.params;

    console.log("postid");
    const post = await Post.findById(postId).populate({
      path: "authorId",
      select: "avatar username organizationName role",
    });
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết này!",
      });
    }
    // Lấy 5 bài viết gần đây
    const recentPosts = await Post.find({ _id: { $ne: postId } })
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .limit(5)
      .populate({
        path: "authorId",
        select: "avatar username organizationName role",
      })
      .select("title images authorId ");
    console.log(post);
    return res.status(200).json({ success: true, post: post, recentPosts });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    console.log("post", post);
    const userId = req.userId;

    const index = post.favorites.indexOf(userId);
    if (index === -1) {
      post.favorites.push(userId);
    } else {
      post.favorites.splice(index, 1);
    }

    await post.save();
    return res.status(200).json({ success: true, favorites: post.favorites });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
exports.fetchPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).populate({
      path: "authorId",
      select: "avatar username organizationName role",
    });
    console.log(posts);
    return res.status(200).json({ success: true, posts: posts });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    } else if (userId.toString() === post.authorId.toString()) {
      post.title = title;
      post.content = content;
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].path);
        }
        post.images = images;
      }

      await post.save();
      return res.status(200).json({ success: true, post: post });
    } else {
      return res.stauts(403).json({ message: "Bạn không được phép chỉnh sửa" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// Xoá bài viết
exports.deletePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    console.log(postId);
    const post = await Post.findById(postId);
    console.log(post);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết này!" });
    }
    const user = await User.findById(userId);
    if (
      userId.toString() === post.authorId.toString() ||
      user.role === "admin 1" ||
      user.role === "admin 2"
    ) {
      console.log("yes");
      await Post.findByIdAndDelete(postId);
      return res
        .status(200)
        .json({ success: true, message: "Xoá bài thành công!" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
