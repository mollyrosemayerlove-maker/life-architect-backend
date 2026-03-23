import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import { generateWeeklySchedule } from '../utils/scheduleGenerator.js';
import { detectConflicts } from '../utils/conflictDetector.js';

const router = express.Router();

router.use(verifyToken);

router.post('/recalculate', async (req, res) => {
  try {
    const userId = req.body.user_id || req.user.user_id;

    // 1. Query user
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid user_id" });
    }
    const user = userRes.rows[0];

    // 2. Extract constraints
    const constraints = {
      work_days: user.work_days,
      work_start_time: user.work_start_time,
      work_end_time: user.work_end_time,
      commute_home_to_work_minutes: user.commute_home_to_work_minutes,
      commute_work_to_gym_minutes: user.commute_work_to_gym_minutes,
      commute_gym_to_home_minutes: user.commute_gym_to_home_minutes,
      gym_days: user.gym_days,
      gym_start_time: user.gym_start_time,
      gym_end_time: user.gym_end_time,
      preferred_sleep_start: user.preferred_sleep_start,
      preferred_sleep_end: user.preferred_sleep_end
    };

    // 3. Generate schedule sequence
    let newBlocks = generateWeeklySchedule(constraints);

    // 4. Detect conflicts
    const conflicts = detectConflicts(newBlocks);
    
    // 5. If conflicts exist: Mock resolver suggestions
    let ai_suggestions = [];
    if (conflicts.length > 0) {
      ai_suggestions = ["Consider shifting your gym time slightly to avoid overlap with evening business.", "Alternatively, compress dinner prep to 15 minutes."];
    }

    // 6. Delete old unlocked blocks
    await pool.query('DELETE FROM schedule_blocks WHERE user_id = $1 AND is_locked = false', [userId]);

    // 7. Insert new schedule_blocks into database
    const insertedBlocks = [];
    for (const b of newBlocks) {
      const insertRes = await pool.query(
        `INSERT INTO schedule_blocks (user_id, day_of_week, start_time, end_time, block_type, description, source, is_locked) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, b.day_of_week, b.start_time, b.end_time, b.block_type, b.description, b.source, b.is_locked]
      );
      insertedBlocks.push(insertRes.rows[0]);
    }

    res.json({ success: true, schedule: insertedBlocks, conflicts, ai_suggestions });

  } catch (err) {
    console.error("Recalculate error:", err);
    res.status(500).json({ success: false, error: "Schedule generation failed" });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.user_id;
    // For the MVP we select all blocks for this user ordered chronologically
    const blocksRes = await pool.query(
      `SELECT * FROM schedule_blocks WHERE user_id = $1 ORDER BY day_of_week, start_time`, 
      [userId]
    );
    res.json({ success: true, schedule: blocksRes.rows });
  } catch(err) {
    console.error("Fetch weekly error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch schedule" });
  }
});

router.post('/lock-block', async (req, res) => {
  try {
    const { block_id, is_locked } = req.body;
    const userId = req.user.user_id;

    const blockRes = await pool.query(
      `UPDATE schedule_blocks SET is_locked = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [is_locked, block_id, userId]
    );

    if (blockRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Block not found" });
    }

    res.json({ success: true, block_id, is_locked });
  } catch(err) {
    console.error("Lock error:", err);
    res.status(500).json({ success: false, error: "Failed to lock block" });
  }
});

router.post('/delete-block', async (req, res) => {
  try {
    const { block_id } = req.body;
    const userId = req.user.user_id;

    const deleteRes = await pool.query(`DELETE FROM schedule_blocks WHERE id = $1 AND user_id = $2 RETURNING id`, [block_id, userId]);
    if(deleteRes.rows.length === 0) {
         return res.status(404).json({ success: false, error: "Block not found" });
    }
    
    res.json({ success: true, message: "Block deleted" });
  } catch(err) {
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});

export default router;
