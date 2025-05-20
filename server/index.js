const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const multer = require('multer');
const path = require('path');
const fs = require('fs'); // for file deleting

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'freelancehub',
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ✅ attach decoded user info to request
    next(); // move on to actual route
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
// Setup storage for avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'avatar_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// *Backend by Habnone
// Download better comments plugin for VSCode

// // TODO 1): Google login integration 
// TODO 2): Job/profile categories 
// TODO 3): Optional company info (hide if empty) 
// TODO 4): Notifications tab 
// TODO 5): Add ratings feature 
// TODO 6): Comments functionality 
// TODO 7): User chat functionality 
// TODO 8): PRO features 

// PRO Features TODO:
// TODO: Subscription purchase flow (can use fake payment)
// TODO: Display "PRO" status badge on profile
// TODO: Allow pinned jobs (PRO accounts only)


// client sectet = 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
app.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatarPath = req.file.path.replace('\\', '/'); // fix Windows slashes
  const userId = req.user.id;

  try {
    // 🔥 Fetch existing avatar path first
    const [rows] = await db.query('SELECT avatar FROM users WHERE id = ?', [userId]);
    const currentAvatar = rows[0]?.avatar;

    // 🔥 Delete old avatar if it exists and is a server file
    if (currentAvatar && currentAvatar.startsWith('uploads/')) {
      fs.unlink(currentAvatar, (err) => {
        if (err) {
          console.error('Failed to delete old avatar:', err.message);
        } else {
          console.log('Deleted old avatar:', currentAvatar);
        }
      });
    }

    // 🔥 Update new avatar path in database
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);

    res.json({ avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Allow express to serve uploaded files
app.use('/uploads', express.static('uploads'));

app.post('/auth/google', async (req, res) => {
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

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}


app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, dob, role, company } = req.body;


  if (!firstName || !lastName || !email || !password || !phone || !dob || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Generate random background color for avatar
    const randomColor = Math.floor(Math.random() * 16777215).toString(16); // random hex color
    const defaultAvatar = `https://placehold.co/150/${randomColor}/ffffff?text=${firstName[0]}${lastName[0]}`;

    await db.query(
  'INSERT INTO users (first_name, last_name, email, password, phone, dob, role, company, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [firstName, lastName, email, hashedPassword, phone, dob, role, company, defaultAvatar]
  );


    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🔐 Create a JWT with only the user ID
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = rows[0];

  res.json({
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    dob: user.dob,
    company: user.company
  });
});


app.post('/update-profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email, phone, bio, avatar, dob, company, currentPassword, newPassword } = req.body;


  try {
    if (newPassword) {
      const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      const user = rows[0];

      const validPass = await bcrypt.compare(currentPassword, user.password);
      if (!validPass) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.query(
  'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, bio = ?, avatar = ?, dob = ?, company = ?, password = ? WHERE id = ?',
  [firstName, lastName, email, phone, bio, avatar, dob, company, hashedPassword, userId]
  );

    } else {
      await db.query(
  'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, bio = ?, avatar = ?, dob = ?, company = ? WHERE id = ?',
  [firstName, lastName, email, phone, bio, avatar, dob, company, userId]
  );

    }

    res.json({ message: 'Profile updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/profile/:username', async (req, res) => {
  const username = req.params.username;

  const [rows] = await db.query(
    'SELECT * FROM users WHERE CONCAT(first_name, "-", last_name) = ?',
    [username]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const user = rows[0];

  res.json({
  id: user.id,
  name: `${user.first_name} ${user.last_name}`,
  email: user.email,
  phone: user.phone,
  role: user.role,
  bio: user.bio || 'No bio yet',
  avatar: user.avatar || 'https://placehold.co/150/png',
  dob: user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set',
  company: user.company || '' 
  });
});

app.post('/create-post', authenticateToken, async (req, res) => {
  const { title, description, category } = req.body;
  const userId = req.user.id; // from the token

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    await db.query(
      'INSERT INTO Posts (user_id, title, description, category, upload_date) VALUES (?, ?, ?, ?, CURRENT_DATE)',
      [userId, title, description, category]
    );

    res.status(201).json({ message: 'Post created successfully.' });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/posts', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.post_id,
        p.title,
        p.description,
        p.upload_date,
        u.first_name,
        u.last_name,
        p.user_id,
        p.category,
        u.avatar
      FROM Posts p
      JOIN Users u ON p.user_id = u.id
      ORDER BY p.post_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/posts/user/:username', async (req, res) => {
  const username = req.params.username; // like John-Smith
  const [firstName, lastName] = username.split('-');

  try {
    const [rows] = await db.query(
      `SELECT 
        p.post_id,
        p.user_id,
        p.title,
        p.description,
        p.upload_date,
        p.category,
        u.first_name,
        u.last_name,
        u.avatar
       FROM Posts p
       JOIN Users u ON p.user_id = u.id
       WHERE u.first_name = ? AND u.last_name = ?
       ORDER BY p.upload_date DESC`,
      [firstName, lastName]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching posts for user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        p.post_id,
        p.user_id,
        p.title,
        p.description,
        p.upload_date,
        u.first_name,
        u.last_name,
        u.avatar
      FROM Posts p
      JOIN Users u ON p.user_id = u.id
      WHERE p.post_id = ?`,
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Single post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.patch('/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { title, description } = req.body;
  const userId = req.user.id;

  try {
    // Check if post exists and belongs to the user
    const [rows] = await db.query('SELECT * FROM Posts WHERE post_id = ?', [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    await db.query(
      'UPDATE Posts SET title = ?, description = ? WHERE post_id = ?',
      [title, description, postId]
    );

    res.json({ message: 'Post updated successfully!' });
  } catch (err) {
    console.error('Edit post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.delete('/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.query('SELECT * FROM Posts WHERE post_id = ?', [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.query('DELETE FROM Posts WHERE post_id = ?', [postId]);

    res.json({ message: 'Post deleted successfully!' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
