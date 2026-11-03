const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["enrolled", "dropped"],
      required: true,
    },
  },
  { _id: false },
);

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  lecturerName: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    required: true,
    default: "OPEN",
  },
  enrollments: {
    type: [enrollmentSchema],
    default: [],
  },
});

module.exports = mongoose.model("Class", classSchema);
