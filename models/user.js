const mongoose = require("mongoose");
const crypto = require("crypto");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      required: false,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
    },
    province: {
      type: String,
    },
    district: {
      type: String,
    },
    ward: {
      type: String,
    },
    addressDetail: {
      type: String,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin 1", "admin 2", "partner", "client"],
      required: true,
    },
    summary: {
      type: String,
    },
    organizationName: {
      type: String,
    },
    avatar: {
      type: String,
    },
    background: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpires: {
      type: Date,
    },
    status: {
      type: String,
      required: false,
    },
    linkQR: {
      type: String,
      required: false,
    },
    website: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

//generate a verification Token
userSchema.methods.getVerificationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  console.log("this", this);
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.verificationTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

  return token;
};

userSchema.index({ verificationTokenExpires: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("User", userSchema);
