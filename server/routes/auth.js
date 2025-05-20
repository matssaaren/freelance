const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db'); // adjust this path if needed

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token missing' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    let user;

    if (existing.length === 0) {
      // Insert new user
      const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, avatar) VALUES (?, ?, ?, ?)',
        [given_name, family_name, email, picture]
      );

      user = {
        id: result.insertId,
        first_name: given_name,
        last_name: family_name,
        email,
        avatar: picture,
        role: null,
      };
    } else {
      user = existing[0];
    }

    const tokenPayload = { id: user.id, email: user.email };
    const authToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

module.exports = router;
