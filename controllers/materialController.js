const Material = require("../models/Material");

exports.getMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (!project || !materialName || !unit || !deliveryDate) {
      return res.status(400).json({
        message:
          "Project, material name, unit, and delivery date are required.",
      });
    }

    const material = await Material.create({
      project,
      materialName,
      quantityDelivered: Number(quantityDelivered || 0),
      quantityUsed: Number(quantityUsed || 0),
      unit,
      supplier: supplier || "",
      deliveryDate,
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
      return res.status(404).json({ message: "Material not found." });
    }

    res.json({ message: "Material deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
