import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/weekly-summary', async (req, res) => {
  res.json({ success: true, message: "Reports API placeholder" });
});

export default router;
