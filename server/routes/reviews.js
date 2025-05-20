const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/auth');

// Setup DB connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'freelancehub'
});

// ✅ POST a new rating
router.post('/ratings/:userId', authenticateToken, async (req, res) => {
  const ratedUserId = parseInt(req.params.userId);
  const raterUserId = req.user.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  if (ratedUserId === raterUserId) {
    return res.status(400).json({ error: "You can't rate yourself." });
  }

  try {
    await db.query(
      'INSERT INTO ratings (rater_user_id, rated_user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [raterUserId, ratedUserId, rating, comment || null]
    );

    res.status(201).json({ message: 'Rating submitted successfully!' });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET all ratings for a user
router.get('/ratings/:userId', async (req, res) => {
  const ratedUserId = parseInt(req.params.userId);

  try {
    const [ratings] = await db.query(
      `SELECT 
         r.id, r.rating, r.comment, r.created_at,
         r.rater_user_id AS from_user_id,
         u.first_name, u.last_name
       FROM ratings r
       JOIN users u ON r.rater_user_id = u.id
       WHERE r.rated_user_id = ?
       ORDER BY r.id DESC`,
      [ratedUserId]
    );

    res.json(ratings);
  } catch (err) {
    console.error('Fetch ratings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
