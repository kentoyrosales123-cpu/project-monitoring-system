const Material = require("../models/Material");

exports.getMaterials = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "inventory") {
      query.project = null;
    }

    if (req.user.role === "staff") {
      query.project = { $ne: null };
    }

    const materials = await Material.find(query)
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getWarehouseMaterialsForRequest = async (req, res) => {
  try {
    const materials = await Material.find({
      project: null,
    }).sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const {
      project,
      materialName,
      quantityDelivered,
      quantityUsed,
      unit,
      supplier,
      deliveryDate,
    } = req.body;

    if (!materialName || !unit || !deliveryDate) {
      return res.status(400).json({
        message:
          "Project, material name, unit, and delivery date are required.",
      });
    }

    const material = await Material.create({
      project: project || null,
      materialName,
      quantityDelivered: Number(quantityDelivered || 0),
      quantityUsed: 0,
      inventoryOnHand: Number(quantityDelivered || 0),
      unit,
      supplier: supplier || "",
      deliveryDate,
      status: "Pending",
      received: false,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    res.json({
      message: "Material deleted.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Inventory Officer → Mark as Out for Delivery

exports.updateInventoryOnHand = async (req, res) => {
  try {
    const { inventoryOnHand } = req.body;

    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    material.inventoryOnHand = Number(inventoryOnHand || 0);
    material.lastUpdatedBy = req.user._id;
    material.lastUpdatedAt = new Date();

    await material.save();

    res.json({
      message: "Inventory on hand updated.",
      material,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateUsedQuantity = async (req, res) => {
  try {
    const { quantityUsed } = req.body;

    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    const used = Number(quantityUsed || 0);

    if (used < 0) {
      return res.status(400).json({
        message: "Used quantity cannot be negative.",
      });
    }

    if (used > Number(material.quantityDelivered || 0)) {
      return res.status(400).json({
        message: "Used quantity cannot exceed delivered quantity.",
      });
    }

    material.quantityUsed = used;
    material.lastUpdatedBy = req.user._id;
    material.lastUpdatedAt = new Date();

    await material.save();

    res.json({
      message: "Used quantity updated.",
      material,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
