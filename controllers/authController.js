const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered.' });

  const user = await User.create({ name, email, password, role: role === 'admin' ? 'admin' : 'staff' });
  res.status(201).json({ token: createToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: createToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.me = async (req, res) => res.json({ user: req.user });

exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
};
