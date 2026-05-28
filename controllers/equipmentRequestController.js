const EquipmentRequest = require("../models/EquipmentRequest");
const Equipment = require("../models/Equipment");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

exports.getRequests = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "staff") {
      query.requestedBy = req.user._id;
    }

    const requests = await EquipmentRequest.find(query)
      .populate("project", "name")
      .populate("equipment", "equipmentName")
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
    const {
      project,
      equipment,
      quantity,
      purpose,
      expectedReturnDate,
      projectLocation,
    } = req.body;

    const request = await EquipmentRequest.create({
      project,
      equipment,
      quantity,
      purpose,
      expectedReturnDate,
      projectLocation,
      requestedBy: req.user._id,
      status: "Pending",
    });

    // notify inventory officers
    const inventoryUsers = await User.find({
      role: "inventory",
    });

    for (const inv of inventoryUsers) {
      await createNotification({
        user: inv._id,
        title: "New Equipment Request",
        message: `${req.user.name} requested equipment.`,
        type: "equipment_request",
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id).populate(
      "equipment",
    );

    if (!request) {
      return res.status(404).json({ message: "Equipment request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be approved.",
      });
    }

    const equipment = request.equipment;

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    if (equipment.equipmentType === "Heavy") {
      if (equipment.status !== "Available") {
        return res.status(400).json({
          message: "This heavy equipment is not available.",
        });
      }

      request.quantity = 1;
    }

    if (equipment.equipmentType === "Small") {
      if (
        Number(equipment.availableQuantity || 0) < Number(request.quantity || 0)
      ) {
        return res.status(400).json({
          message: `Cannot approve. Available quantity is only ${equipment.availableQuantity}.`,
        });
      }
    }

    request.status = "Approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();
    await createNotification({
      user: request.requestedBy,
      title: "Equipment Request Approved",
      message: "Your equipment request was approved.",
      type: "approved",
    });

    res.json({
      message: "Equipment request approved.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Equipment request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be rejected.",
      });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();
    await createNotification({
      user: request.requestedBy,
      title: "Equipment Request Rejected",
      message: "Your equipment request was rejected.",
      type: "rejected",
    });

    res.json({
      message: "Equipment request rejected.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markOutForDelivery = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Equipment request not found." });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved requests can be marked as out for delivery.",
      });
    }

    const equipment = await Equipment.findById(request.equipment);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found." });
    }

    if (equipment.equipmentType === "Heavy") {
      equipment.totalQuantity = 1;

      equipment.availableQuantity = 0;
      equipment.borrowedQuantity = 1;

      equipment.status = "Assigned";

      equipment.assignedProject = request.project;

      equipment.currentLocation =
        request.projectLocation || equipment.currentLocation;

      request.quantity = 1;
    }

    if (equipment.equipmentType === "Small") {
      if (
        Number(equipment.availableQuantity || 0) < Number(request.quantity || 0)
      ) {
        return res.status(400).json({
          message: `Cannot deliver. Available quantity is only ${equipment.availableQuantity}.`,
        });
      }

      equipment.availableQuantity =
        Number(equipment.availableQuantity || 0) -
        Number(request.quantity || 0);

      equipment.borrowedQuantity =
        Number(equipment.borrowedQuantity || 0) + Number(request.quantity || 0);
    }

    request.status = "Out for Delivery";
    request.deliveredAt = new Date();

    await equipment.save();
    await request.save();
    await createNotification({
      user: request.requestedBy,
      title: "Equipment Out for Delivery",
      message: "Equipment is now out for delivery.",
      type: "out_for_delivery",
    });

    res.json({
      message: "Equipment marked out for delivery.",
      request,
      equipment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmReceived = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Equipment request not found." });
    }

    if (request.status !== "Out for Delivery") {
      return res.status(400).json({
        message: "Only out for delivery equipment can be confirmed received.",
      });
    }

    request.status = "In Use";
    request.receivedBy = req.user._id;
    request.receivedAt = new Date();

    await request.save();
    const inventoryUsers = await User.find({
      role: "inventory",
    });

    for (const inv of inventoryUsers) {
      await createNotification({
        user: inv._id,
        title: "Equipment Received",
        message: `${req.user.name} confirmed receiving equipment.`,
        type: "received",
      });
    }

    res.json({
      message: "Equipment received and now in use.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestReturn = async (req, res) => {
  try {
    const { returnCondition } = req.body;

    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Equipment request not found." });
    }

    if (request.status !== "In Use") {
      return res.status(400).json({
        message: "Only equipment in use can be requested for return.",
      });
    }

    request.status = "Return Requested";
    request.returnCondition = returnCondition || "Good";

    await request.save();

    const inventoryUsers = await User.find({ role: "inventory" });

    for (const inv of inventoryUsers) {
      await createNotification({
        user: inv._id,
        title: "Equipment Return Requested",
        message: `${req.user.name} requested to return equipment.`,
        type: "returned",
      });
    }

    res.json({
      message: "Equipment return requested.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmReturned = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Equipment request not found.",
      });
    }

    if (request.status !== "Return Requested") {
      return res.status(400).json({
        message: "Return request required first.",
      });
    }

    const equipment = await Equipment.findById(request.equipment);

    if (!equipment) {
      return res.status(404).json({
        message: "Equipment not found.",
      });
    }

    // HEAVY EQUIPMENT
    if (equipment.equipmentType === "Heavy") {
      equipment.availableQuantity = 1;
      equipment.borrowedQuantity = 0;

      equipment.status = "Available";

      equipment.assignedProject = null;

      equipment.currentLocation = equipment.warehouseLocation || "Warehouse";
    }

    // SMALL EQUIPMENT
    else {
      equipment.borrowedQuantity =
        Number(equipment.borrowedQuantity || 0) - Number(request.quantity || 0);

      if (request.returnCondition === "Good") {
        equipment.availableQuantity =
          Number(equipment.availableQuantity || 0) +
          Number(request.quantity || 0);
      } else {
        equipment.condition =
          request.returnCondition === "Lost" ? "Damaged" : "Maintenance";
      }
    }

    request.status = "Returned";
    request.returnedAt = new Date();

    await equipment.save();
    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Equipment Return Approved",
      message: "Your equipment return has been confirmed by inventory.",
      type: "returned",
    });

    res.json({
      message: "Equipment return confirmed.",
      request,
      equipment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
