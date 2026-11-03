const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  upsertClassAttendances,
  getClassStudents,
  getClassAttendancesSummary,
} = require("../controllers/classController");

const router = express.Router();

router.post("/:classId/attendances", verifyToken, upsertClassAttendances);
router.get("/:classId/students", verifyToken, getClassStudents);
router.get(
  "/:classId/attendances-summary",
  verifyToken,
  getClassAttendancesSummary,
);
router.get(
  "/:classId/attendance-summary",
  verifyToken,
  getClassAttendancesSummary,
);

module.exports = router;
