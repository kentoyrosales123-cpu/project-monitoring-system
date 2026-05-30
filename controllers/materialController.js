const Material = require("../models/Material");
const Project = require("../models/Project");

const projectAccessFilter = async (user) => {
  if (user.role === "staff") {
    const projects = await Project.find({ assignedStaff: user._id }).select(
      "_id",
    );

    return {
      project: { $in: projects.map((project) => project._id) },
    };
  }

  if (user.role === "inventory") {
    return { project: null };
  }

  if (user.role === "client") {
    const projects = await Project.find({ clientUser: user._id }).select("_id");

    return {
      project: { $in: projects.map((project) => project._id) },
    };
  }

  return {};
};

const canManageProjectMaterial = async (user, material) => {
  if (user.role === "admin") return true;
  if (user.role !== "staff" || !material.project) return false;

  const project = await Project.findOne({
    _id: material.project,
    assignedStaff: user._id,
  }).select("_id");

  return Boolean(project);
};

exports.getMaterials = async (req, res) => {
  try {
    const query = await projectAccessFilter(req.user);

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
      category,
      unit,
      quantityDelivered,
      quantityUsed,
      supplier,
      deliveryDate,
      reorderLevel,
      unitCost,
    } = req.body;

    const delivered = Number(quantityDelivered || 0);
    const used = Number(quantityUsed || 0);

    if (delivered < 0 || used < 0) {
      return res.status(400).json({
        message: "Material quantities cannot be negative.",
      });
    }

    if (used > delivered) {
      return res.status(400).json({
        message: "Used quantity cannot exceed delivered quantity.",
      });
    }

    const material = await Material.create({
      project: project || null,
      materialName,
      category: category || "",
      unit,
      quantityDelivered: delivered,
      quantityUsed: used,
      inventoryOnHand: delivered - used,
      supplier: supplier || "",
      deliveryDate,
      reorderLevel: Number(reorderLevel || 0),
      unitCost: Number(unitCost || 0),
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Admin or Inventory Officer access only.",
      });
    }

    const onHand = Number(inventoryOnHand || 0);

    if (onHand < 0) {
      return res.status(400).json({
        message: "Inventory on hand cannot be negative.",
      });
    }

    material.inventoryOnHand = onHand;
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

    const canUpdate = await canManageProjectMaterial(req.user, material);

    if (!canUpdate) {
      return res.status(403).json({
        message: "Only admin or assigned staff can update material usage.",
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
    material.inventoryOnHand = Number(material.quantityDelivered || 0) - used;
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
