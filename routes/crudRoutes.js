const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

module.exports = (controller, adminCreate = false) => {
  router.get("/", protect, controller.list);

  router.get("/:id", protect, controller.getOne);

  router.post(
    "/",
    protect,
    adminCreate ? adminOnly : (req, res, next) => next(),
    controller.create,
  );

  router.put("/:id", protect, controller.update);

  router.delete("/:id", protect, adminOnly, controller.remove);

  return router;
};
