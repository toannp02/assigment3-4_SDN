const mongoose = require("mongoose");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");

const upsertClassAttendances = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const { date, records } = req.body ?? {};
    if (date === undefined || date === null || date === "") {
      return res.status(400).json({ message: "Date is required" });
    }

    const attendanceDate = new Date(date);
    if (Number.isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ message: "Date must be a valid date" });
    }
    if (attendanceDate > new Date()) {
      return res.status(400).json({ message: "Date cannot be in the future" });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ message: "Records must be a non-empty array" });
    }

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ message: "Class not found" });
    }

    const enrolledStudentIds = new Set(
      classRecord.enrollments
        .filter(
          (enrollment) =>
            String(enrollment.status).toUpperCase() === "ENROLLED",
        )
        .map((enrollment) => enrollment.studentId.toString()),
    );

    const validatedRecords = [];
    for (const record of records) {
      if (!record || typeof record !== "object") {
        return res
          .status(400)
          .json({ message: "Each record must be an object" });
      }
      if (!mongoose.isValidObjectId(record.studentId)) {
        return res
          .status(400)
          .json({ message: "Invalid student ID in records" });
      }
      if (!enrolledStudentIds.has(record.studentId.toString())) {
        return res.status(400).json({
          message: "Every student must be enrolled in this class",
        });
      }

      const status =
        typeof record.status === "string" ? record.status.toUpperCase() : "";
      if (!["PRESENT", "ABSENT"].includes(status)) {
        return res.status(400).json({
          message: "Attendance status must be PRESENT or ABSENT",
        });
      }

      validatedRecords.push({
        studentId: new mongoose.Types.ObjectId(record.studentId),
        status,
      });
    }

    const operations = validatedRecords.map(({ studentId, status }) => ({
      updateOne: {
        filter: { classId, studentId, date: attendanceDate },
        update: { $set: { status } },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(operations);
    return res.status(200).json({
      message: "Attendance records saved",
      processedCount: validatedRecords.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to save attendance records" });
  }
};

const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const status = req.query.status ?? "enrolled";
    if (
      typeof status !== "string" ||
      !["enrolled", "dropped"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be either enrolled or dropped",
      });
    }

    const classRecord = await Class.findById(classId).populate(
      "enrollments.studentId",
      "studentCode fullName email",
    );

    if (!classRecord) {
      return res.status(404).json({ message: "Class not found" });
    }

    const students = classRecord.enrollments
      .filter((enrollment) => enrollment.status === status)
      .map((enrollment) => enrollment.studentId)
      .filter(Boolean)
      .map((student) => ({
        studentId: student._id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
      }));

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get class students" });
  }
};

const getClassAttendancesSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const classRecord = await Class.findById(classId).populate(
      "enrollments.studentId",
      "studentCode fullName",
    );
    if (!classRecord) {
      return res.status(404).json({ message: "Class not found" });
    }

    const summaries = new Map();
    for (const enrollment of classRecord.enrollments) {
      if (String(enrollment.status).toUpperCase() !== "ENROLLED") continue;

      const student = enrollment.studentId;
      const studentId = (student?._id ?? student)?.toString();
      if (!studentId) continue;

      summaries.set(studentId, {
        studentId,
        studentCode: student.studentCode,
        fullName: student.fullName,
        totalSessions: 0,
        present: 0,
        absent: 0,
      });
    }

    const attendances = await Attendance.find({ classId }).lean();

    for (const attendance of attendances) {
      const summary = summaries.get(attendance.studentId.toString());
      if (!summary) continue;

      if (attendance.status === "PRESENT") {
        summary.present += 1;
        summary.totalSessions += 1;
      } else if (attendance.status === "ABSENT") {
        summary.absent += 1;
        summary.totalSessions += 1;
      }
    }

    const summary = Array.from(summaries.values()).map((student) => {
      const attendanceRate =
        student.totalSessions === 0
          ? 0
          : Number(
              ((student.present / student.totalSessions) * 100).toFixed(1),
            );

      return {
        ...student,
        attendanceRate,
        warning: attendanceRate < 80,
      };
    });

    return res.status(200).json({
      classId: classRecord._id,
      className: classRecord.className,
      students: summary,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get attendance summary" });
  }
};

module.exports = {
  upsertClassAttendances,
  getClassStudents,
  getClassAttendancesSummary,
};
