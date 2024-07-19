const express = require("express");
const { updateExpireDate } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", updateExpireDate);

module.exports = router;
