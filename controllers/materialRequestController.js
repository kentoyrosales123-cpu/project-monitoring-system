const MaterialRequest = require("../models/MaterialRequest");
const Material = require("../models/Material");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

exports.getRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "staff") {
      query.requestedBy = req.user._id;
    }

    const requests = await MaterialRequest.find(query)
      .populate("project", "name")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .populate("receivedBy", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { project, materialName, quantity, unit, purpose } = req.body;

    const request = await MaterialRequest.create({
      project,
      materialName,
      quantity,
      unit,
      purpose,
      requestedBy: req.user._id,
      status: "Pending",
    });

    // notify inventory officers
    const inventoryUsers = await User.find({
      role: { $in: ["admin", "inventory"] },
    });

    for (const inv of inventoryUsers) {
      await createNotification({
        user: inv._id,
        title: "New Material Request",
        message: `${req.user.name} requested ${materialName}`,
        type: "material_request",
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Material request not found." });
    }

    const material = await Material.findOne({
      project: null,
      materialName: new RegExp(`^${request.materialName.trim()}$`, "i"),
    });

    if (!material) {
      return res.status(400).json({
        message: "Cannot approve. Material does not exist in warehouse stock.",
      });
    }

    const availableStock = Number(material.quantityDelivered || 0);

    if (availableStock < Number(request.quantity || 0)) {
      return res.status(400).json({
        message: `Cannot approve. Available warehouse stock is only ${availableStock} ${material.unit}.`,
      });
    }

    request.status = "Approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Material Request Approved",
      message: `Your request for ${request.materialName} has been approved.`,
      type: "approved",
    });

    res.json({
      message: "Material request approved.",
      request,
      availableStock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Material request not found." });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Material Request Rejected",
      message: `Your request for ${request.materialName} was rejected.`,
      type: "rejected",
    });

    res.json({
      message: "Material request rejected.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markOutForDelivery = async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved requests can be marked as out for delivery.",
      });
    }

    request.status = "Out for Delivery";
    request.deliveredAt = new Date();

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Material Out for Delivery",
      message: `${request.materialName} is now out for delivery.`,
      type: "out_for_delivery",
    });

    res.json({
      message: "Material marked as out for delivery.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmReceived = async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "Out for Delivery") {
      return res.status(400).json({
        message: "Only out for delivery requests can be confirmed.",
      });
    }

    // FIND WAREHOUSE MATERIAL
    const warehouseMaterial = await Material.findOne({
      project: null,
      materialName: new RegExp(`^${request.materialName.trim()}$`, "i"),
    });

    if (!warehouseMaterial) {
      return res.status(400).json({
        message: "Warehouse material not found.",
      });
    }

    const requestQty = Number(request.quantity || 0);

    const availableStock = Number(warehouseMaterial.quantityDelivered || 0);

    if (availableStock < requestQty) {
      return res.status(400).json({
        message: `Only ${availableStock} ${warehouseMaterial.unit} available in warehouse.`,
      });
    }

    // ✅ AUTOMATIC DEDUCT FROM WAREHOUSE
    warehouseMaterial.quantityDelivered =
      Number(warehouseMaterial.quantityDelivered || 0) - requestQty;

    warehouseMaterial.inventoryOnHand = Number(
      warehouseMaterial.quantityDelivered || 0,
    );

    warehouseMaterial.lastUpdatedBy = req.user._id;
    warehouseMaterial.lastUpdatedAt = new Date();

    await warehouseMaterial.save();

    // MARK REQUEST DELIVERED
    request.status = "Delivered";
    request.receivedBy = req.user._id;
    request.receivedAt = new Date();

    // ADD TO PROJECT MATERIALS
    let projectMaterial = await Material.findOne({
      project: request.project,
      materialName: new RegExp(`^${request.materialName.trim()}$`, "i"),
    });

    if (projectMaterial) {
      projectMaterial.quantityDelivered =
        Number(projectMaterial.quantityDelivered || 0) + requestQty;

      projectMaterial.inventoryOnHand =
        Number(projectMaterial.quantityDelivered || 0) -
        Number(projectMaterial.quantityUsed || 0);

      projectMaterial.lastUpdatedBy = req.user._id;
      projectMaterial.lastUpdatedAt = new Date();

      await projectMaterial.save();
    } else {
      projectMaterial = await Material.create({
        project: request.project,
        materialName: request.materialName.trim(),
        category: warehouseMaterial.category || "",
        reorderLevel: 0,
        unitCost: warehouseMaterial.unitCost || 0,
        quantityDelivered: requestQty,
        quantityUsed: 0,
        inventoryOnHand: requestQty,
        unit: request.unit || warehouseMaterial.unit || "pcs",
        supplier: "Warehouse Delivery",
        deliveryDate: new Date(),
        status: "Delivered",
        received: true,
        receivedAt: new Date(),
        lastUpdatedBy: req.user._id,
        lastUpdatedAt: new Date(),
      });
    }

    await request.save();

    const inventoryUsers = await User.find({
      role: { $in: ["admin", "inventory"] },
    });

    for (const inv of inventoryUsers) {
      await createNotification({
        user: inv._id,
        title: "Material Received",
        message: `${req.user.name} confirmed receiving ${request.materialName}. Warehouse stock deducted.`,
        type: "received",
      });
    }

    res.json({
      message:
        "Material received successfully. Warehouse inventory automatically deducted.",
      request,
      warehouseMaterial,
      projectMaterial,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
