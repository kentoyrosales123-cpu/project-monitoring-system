const Manpower = require("../models/Manpower");

exports.getManpower = async (req, res) => {
  try {
    const manpower = await Manpower.find()
      .populate("project", "name")
      .sort({ date: -1, createdAt: -1 });

    res.json(manpower);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createManpower = async (req, res) => {
  try {
    const { project, date, skilledWorkers, helpers, engineers, operators } =
      req.body;

    const manpower = await Manpower.create({
      project,
      date,
      skilledWorkers: Number(skilledWorkers || 0),
      helpers: Number(helpers || 0),
      engineers: Number(engineers || 0),
      operators: Number(operators || 0),
    });

    res.status(201).json(manpower);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteManpower = async (req, res) => {
  try {
    await Manpower.findByIdAndDelete(req.params.id);
    res.json({ message: "Manpower deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
