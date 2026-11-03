const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    required: true,
    default: "ACTIVE",
  },
});

module.exports = mongoose.model("Subject", subjectSchema);
