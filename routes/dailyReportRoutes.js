const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const c = require('../controllers/dailyReportController');
router.get('/', protect, c.getReports);
router.post('/', protect, upload.array('photos', 5), c.createReport);
router.delete('/:id', protect, adminOnly, c.deleteReport);
module.exports = router;
