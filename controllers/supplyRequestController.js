const SupplyRequest = require("../models/SupplyRequest");
const Material = require("../models/Material");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

exports.getSupplyRequests = async (req, res) => {
  try {
    const requests = await SupplyRequest.find()
      .populate("material", "materialName")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSupplyRequest = async (req, res) => {
  try {
    const { materialId, requestedQty, reason } = req.body;

    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    const currentQty =
      Number(material.quantityDelivered || 0) -
      Number(material.quantityUsed || 0);

    if (currentQty > Number(material.reorderLevel || 0)) {
      return res.status(400).json({
        message: "This material is not below reorder level.",
      });
    }

    const request = await SupplyRequest.create({
      material: material._id,
      materialName: material.materialName,
      category: material.category || "",
      unit: material.unit || "",
      currentQty,
      reorderLevel: material.reorderLevel || 0,
      requestedQty: Number(requestedQty || 0),
      reason,
      requestedBy: req.user._id,
      status: "Pending",
    });

    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        title: "New Restock Request",
        message: `${req.user.name} requested restock for ${material.materialName}.`,
        type: "material_request",
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveSupplyRequest = async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Restock request not found." });
    }

    request.status = "Approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Restock Request Approved",
      message: `Your restock request for ${request.materialName} was approved.`,
      type: "approved",
    });

    res.json({ message: "Restock request approved.", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectSupplyRequest = async (req, res) => {
  try {
    const request = await SupplyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Restock request not found." });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Restock Request Rejected",
      message: `Your restock request for ${request.materialName} was rejected.`,
      type: "rejected",
    });

    res.json({ message: "Restock request rejected.", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
