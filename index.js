const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'database_db',
  password: 'Vinay@1130',
  port: 5432,
});

// --- Signup
app.post('/signup', async (req, res) => {
  const { name, email, password, country } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password, country) VALUES ($1, $2, $3, $4) RETURNING id, name, email, country',
      [name, email, password, country]
    );
    res.json({ message: 'Signup successful', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "User Already Exists" });
  }
});

// --- Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    if (user.rows[0].password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user_id: user.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create Task (max 4 per user)
app.post('/tasks', async (req, res) => {
  const { user_id, project_name, title, description, status, completed_at } = req.body;

  try {
    const projectCount = await pool.query(
      'SELECT COUNT(DISTINCT project_name) FROM tasks WHERE user_id = $1',
      [user_id]
    );

    if (parseInt(projectCount.rows[0].count) >= 4) {
      return res.status(400).json({ error: 'Maximum 4 projects allowed per user' });
    }

    const task = await pool.query(
      'INSERT INTO tasks (user_id, project_name, title, description, status, completed_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, project_name, title, description, status, completed_at || null]
    );
    res.json(task.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Read all Tasks
app.get('/tasks/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update Task
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, completed_at } = req.body;

  try {
    const updatedTask = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, completed_at = $4 WHERE id = $5 RETURNING *',
      [title, description, status, completed_at || null, id]
    );
    res.json(updatedTask.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete Task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
