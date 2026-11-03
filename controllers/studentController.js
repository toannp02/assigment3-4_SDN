const mongoose = require("mongoose");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const getStudentAttendances = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId).select(
      "studentCode fullName email",
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendances = await Attendance.find({ studentId })
      .populate({
        path: "classId",
        model: Class,
        select: "className subjectId",
        populate: {
          path: "subjectId",
          model: Subject,
          select: "name",
        },
      })
      .sort({ date: -1 });

    const attendanceHistory = attendances.map((attendance) => ({
      className: attendance.classId?.className ?? null,
      subjectName: attendance.classId?.subjectId?.name ?? null,
      date: attendance.date,
      status: attendance.status,
    }));

    return res.status(200).json(attendanceHistory);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get student attendances" });
  }
};

module.exports = { getStudentAttendances };
