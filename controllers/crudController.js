exports.crud = (Model, options = {}) => ({
  list: async (req, res) => {
    const docs = await Model.find().populate(options.populate || '').sort({ createdAt: -1 });
    res.json(docs);
  },
  create: async (req, res) => {
    const body = options.attachUser ? { ...req.body, [options.attachUser]: req.user._id } : req.body;
    const doc = await Model.create(body);
    res.status(201).json(doc);
  },
  update: async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Record not found.' });
    res.json(doc);
  },
  remove: async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Record deleted.' });
  }
});
