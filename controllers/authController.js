const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { getJwtSecret, expiresIn } = require("../config/jwt");
const testAccountEmail = process.env.TEST_ACCOUNT_EMAIL?.trim().toLowerCase();
const testAccountPassword = process.env.TEST_ACCOUNT_PASSWORD;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let subject;

    if (normalizedEmail === testAccountEmail && testAccountPassword) {
      if (password !== testAccountPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      subject = `test:${normalizedEmail}`;
    } else {
      const student = await Student.findOne({ email: normalizedEmail }).select(
        "+passwordHash",
      );

      if (
        !student ||
        !student.passwordHash ||
        !(await bcrypt.compare(password, student.passwordHash))
      ) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      subject = student._id.toString();
    }

    const token = jwt.sign({ sub: subject }, getJwtSecret(), { expiresIn });

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
};

module.exports = { login };
