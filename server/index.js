const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const clientIP = process.env.CLIENT_URL

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'freelancehub',
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

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
// // TODO 2): Job/profile categories 
// // TODO 3): Optional company info (hide if empty) 
// TODO 4): Notifications tab 
// // TODO 5): Add ratings feature 
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
  const avatarPath = req.file.path.replace('\\', '/');
  const userId = req.user.id;
  try {
    const [rows] = await db.query('SELECT avatar FROM users WHERE id = ?', [userId]);
    const currentAvatar = rows[0]?.avatar;
    if (currentAvatar && currentAvatar.startsWith('uploads/')) {
      fs.unlink(currentAvatar, (err) => {
        if (err) {
          console.error('Failed to delete old avatar:', err.message);
        } else {
          console.log('Deleted old avatar:', currentAvatar);
        }
      });
    }
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
    res.json({ avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let username = `${given_name.toLowerCase()}-${family_name.toLowerCase()}`;
    const [existingUsername] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
      username = `${given_name.toLowerCase()}-${family_name.toLowerCase()}${existingUsername.length + 1}`;
    }
    let user;
    if (existing.length === 0) {
      const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, avatar, username) VALUES (?, ?, ?, ?, ?)',
        [given_name, family_name, email, picture, username]
      );
      user = {
        id: result.insertId,
        username: username,
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

app.post('/register', async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    email,
    password,
    phone,
    dob,
    role,
    company
  } = req.body;
  if (
    !username ||
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !phone ||
    !dob ||
    !role
  ) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return res
      .status(400)
      .json({
        error:
          'Username must be 3–20 characters and contain only letters, numbers, hyphens or underscores',
      });
  }
  try {
    const [byEmail] = await db.query(
      'SELECT 1 FROM users WHERE email = ?',
      [email]
    );
    if (byEmail.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const [byUsername] = await db.query(
      'SELECT 1 FROM users WHERE username = ?',
      [username]
    );
    if (byUsername.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const c = Math.floor(Math.random() * 16777215).toString(16);
    const defaultAvatar = `https://placehold.co/150/${c}/ffffff?text=${firstName[0]}${lastName[0]}`;
    await db.query(
      `
      INSERT INTO users
        (username, first_name, last_name, email, password, phone, dob, role, company, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        username,
        firstName,
        lastName,
        email,
        hashed,
        phone,
        dob,
        role,
        company || null,
        defaultAvatar,
      ]
    );
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Register error:', err);
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
    username: user.username,
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
  const updates = [];
  const params  = [];
  const fieldMap = {
    firstName: 'first_name',
    lastName:  'last_name',
    email:     'email',
    phone:     'phone',
    bio:       'bio',
    avatar:    'avatar',
    dob:       'dob',
    company:   'company'
  };
  for (const key of Object.keys(fieldMap)) {
    if (req.body[key] !== undefined) {
      updates.push(`${fieldMap[key]} = ?`);
      params.push(req.body[key]);
    }
  }
  if (req.body.newPassword) {
    if (!req.body.currentPassword) {
      return res.status(400).json({ error: 'Current password is required to change password' });
    }
    try {
      const [[{ password: hashOnDb }]] = await db.query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );
      const good = await bcrypt.compare(req.body.currentPassword, hashOnDb);
      if (!good) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(req.body.newPassword, 10);
      updates.push('password = ?');
      params.push(newHash);
    } catch (err) {
      console.error('Password-change error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  params.push(userId);
  try {
    await db.query(sql, params);
    res.json({ message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Update-profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/profile/:username', async (req, res) => {
  const username = req.params.username;
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ?',
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
    username: user.username,
    bio: user.bio || 'No bio yet',
    avatar: user.avatar || 'https://placehold.co/150/png',
    dob: user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set',
    company: user.company || ''
  });
});

app.post('/create-post', authenticateToken, async (req, res) => {
  const { title, description, category } = req.body;
  const userId = req.user.id;
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
        u.username,
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
  const username = req.params.username;
  try {
    const [rows] = await db.query(
      `SELECT 
        p.post_id,
        p.user_id,
        p.title,
        p.description,
        p.upload_date,
        p.category,
        u.username,
        u.first_name,
        u.last_name,
        u.avatar
       FROM Posts p
       JOIN Users u ON p.user_id = u.id
       WHERE u.username = ?
       ORDER BY p.upload_date DESC`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No posts found for this username.' });
    }
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

const reviewsRoutes = require('./routes/reviews');
app.use('/reviews', reviewsRoutes);


// get all users for participant dropdown
app.get('/users', authenticateToken, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, first_name, last_name, username FROM users'
  );
  res.json(rows);
});

// create conversation with current user + others
app.post('/conversations', authenticateToken, async (req, res) => {
  const me = req.user.id;
  const { name, participantIds } = req.body;
  const ids = [...new Set([me, ...participantIds])];

  // insert, passing name if provided
  const [r] = await db.query(
    name
      ? 'INSERT INTO conversations (name) VALUES (?)'
      : 'INSERT INTO conversations () VALUES ()',
    name ? [name] : []
  );
  const convoId = r.insertId;

  const rows = ids.map(u => [convoId, u]);
  await db.query(
    'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ?',
    [rows]
  );

  res.status(201).json({ conversationId: convoId });
});

// add a user to an existing conversation
app.post('/conversations/:id/participants', authenticateToken, async (req, res) => {
  const convoId = +req.params.id;
  const { userId } = req.body;
  await db.query(
    'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?,?)',
    [convoId, userId]
  );
  res.sendStatus(204);
});

// fetch message history
app.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const convoId = +req.params.id;
  const [rows] = await db.query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
            u.first_name, u.last_name, u.avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [convoId]
  );
  res.json(rows);
});

// GET /api/conversations/:id
app.get('/conversations/:id', authenticateToken, async (req, res) => {
  const cid = +req.params.id;
  const [parts] = await db.query(
    `SELECT u.id, u.first_name, u.last_name
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = ?`,
    [cid]
  );
  res.json({ id: cid, participants: parts });
});


app.get('/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // 1) get all convo IDs the user belongs to
    const [convos] = await db.query(
      `SELECT c.id,
              MAX(m.created_at) AS last_activity
       FROM conversations c
       JOIN conversation_participants cp
         ON cp.conversation_id = c.id
       LEFT JOIN messages m
         ON m.conversation_id = c.id
       WHERE cp.user_id = ?
       GROUP BY c.id
       ORDER BY last_activity DESC`,
      [userId]
    );

    // 2) for each convo, load the *other* participant(s)
    for (let convo of convos) {
      const [parts] = await db.query(
        `SELECT 
        u.id,
+       u.username,
        u.first_name,
        u.last_name,
        u.avatar
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = ? AND cp.user_id <> ?`,
        [convo.id, userId]
      );
      convo.participants = parts;
    }

    res.json(convos);
  } catch (err) {
    console.error('Error listing conversations', err);
    res.status(500).json({ error: 'Could not fetch conversations' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientIP, methods: ['GET','POST'] }
});

io.on('connection', socket => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('identify', ({ userId }) => {
    console.log(`👤 identify → user_${userId}`);
    socket.join(`user_${userId}`);
  });

  socket.on('join_convo', ({ conversationId }) => {
    console.log(`🔑 join_convo → convo_${conversationId}`);
    socket.join(`convo_${conversationId}`);
  });

  socket.on('send_message', async ({ conversationId, senderId, content }) => {
    console.log('✉️ send_message payload:', { conversationId, senderId, content });
    try {
      const [res] = await db.query(
        'INSERT INTO messages (conversation_id,sender_id,content) VALUES (?,?,?)',
        [conversationId, senderId, content]
      );
      const messageId = res.insertId;
      const [[ row ]] = await db.query(
        'SELECT m.*, u.first_name, u.last_name, u.avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id = ?',
        [messageId]
      );
      console.log('💾 persisted message:', row);

      io.to(`convo_${conversationId}`).emit('new_message', row);
      console.log(`🚀 emitted new_message to convo_${conversationId}`);

      const [parts] = await db.query(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id <> ?',
        [conversationId, senderId]
      );
      for (const p of parts) {
        io.to(`user_${p.user_id}`).emit('new_notification', {
          type: 'message',
          conversationId,
          message: row,
        });
        console.log(`🔔 notified user_${p.user_id}`);
      }
    } catch (err) {
      console.error('❌ send_message handler error:', err);
    }
  });
});




server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
