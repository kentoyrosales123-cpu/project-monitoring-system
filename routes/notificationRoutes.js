const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.put("/read", protect, markAsRead);

router.delete("/delete-all", protect, deleteAllNotifications);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
