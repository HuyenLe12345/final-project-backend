const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    images: [{ type: String, required: true }],
    goals: [
      {
        form: {
          type: String,
          required: true,
        },
        goal: {
          type: Number,
          required: true,
        },
        raised: {
          type: Number,
          default: 0,
        },
      },
    ],
    types: [{ type: String, required: true }],
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    deadline: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Project", projectSchema);
