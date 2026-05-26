const router = require('express').Router();
const { register, login, me, getUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/users', protect, adminOnly, getUsers);
module.exports = router;
