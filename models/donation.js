// models/Donation.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const donationSchema = new Schema(
  {
    donorName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    typeOfDonation: {
      type: String,
      enum: ["money", "clothes", "book"],
      required: true,
    },
    registered: {
      type: Number,
      required: true,
    },
    raised: {
      type: Number,
      default: 0,
      required: false,
    },
    transactionCode: {
      type: String,
      unique: true, // Ensure each transaction code is unique
    },
    status: {
      type: String,
      enum: ["pending", "confirm", "reject"],
      default: "pending",
    },
    reasonForRejection: {
      type: String,
      required: false,
    },
    anonymous: {
      type: Boolean,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Project",
    },
    donorId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    registeredTransport: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
); // Automatically add createdAt and updatedAt fields

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
