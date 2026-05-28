const Notification = require("../models/Notification");

const createNotification = async ({ user, title, message, type }) => {
  try {
    await Notification.create({
      user,
      title,
      message,
      type,
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = createNotification;
