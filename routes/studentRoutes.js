const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const { getStudentAttendances } = require("../controllers/studentController");

const router = express.Router();

router.get("/:studentId/attendances", verifyToken, getStudentAttendances);

module.exports = router;
