const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    // Thay thế projectId bằng contentId và thêm trường contentType
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "contentType", // Sử dụng refPath để xác định model
    },
    contentType: {
      type: String,
      required: true,
      enum: ["project", "post"], // Chỉ cho phép 2 loại
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
