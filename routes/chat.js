import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
  res.json({ success: true, message: "Chat API placeholder" });
});

export default router;
