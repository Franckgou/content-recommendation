require("dotenv").config(); // Load environment variables

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const cors = require("cors");
const { PythonShell } = require("python-shell");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Signup API
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email or username already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to the database
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    // Generate JWT
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, userId: newUser.rows[0].id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if password is correct
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, userId: user.rows[0].id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get popular movies (most liked)
app.get("/movies/popular", async (req, res) => {
  try {
    const popularMovies = await pool.query(`
      SELECT movies.*, COUNT(user_interactions.movie_id) as likes 
      FROM movies 
      LEFT JOIN user_interactions ON movies.id = user_interactions.movie_id 
      AND user_interactions.liked = true 
      GROUP BY movies.id 
      ORDER BY likes DESC 
      LIMIT 10
    `);
    res.json(popularMovies.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/movies", async (req, res) => {
  try {
    const movies = await pool.query("SELECT * FROM movies");
    res.json(movies.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Like Endpoint
app.post("/movies/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await pool.query(
      `INSERT INTO user_interactions 
       (user_id, movie_id, liked, watch_later) 
       VALUES ($1, $2, true, false)
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET liked = EXCLUDED.liked, watch_later = EXCLUDED.watch_later`,
      [userId, id]
    );

    res.json({ message: "Like updated successfully" });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Dislike Endpoint
app.post("/movies/:id/dislike", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await pool.query(
      `INSERT INTO user_interactions 
       (user_id, movie_id, liked, watch_later) 
       VALUES ($1, $2, false, false)
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET liked = EXCLUDED.liked, watch_later = EXCLUDED.watch_later`,
      [userId, id]
    );

    res.json({ message: "Dislike updated successfully" });
  } catch (err) {
    console.error("Dislike error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Watch Later Endpoint
app.post("/movies/:id/watch-later", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await pool.query(
      `INSERT INTO user_interactions 
       (user_id, movie_id, watch_later) 
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET watch_later = EXCLUDED.watch_later`,
      [userId, id]
    );

    res.json({ message: "Watch later updated successfully" });
  } catch (err) {
    console.error("Watch later error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fetch user's watch-later movies
app.get("/user/:id/watch-later", async (req, res) => {
  try {
    const { id } = req.params;
    const watchLaterMovies = await pool.query(
      "SELECT movies.* FROM movies JOIN user_interactions ON movies.id = user_interactions.movie_id WHERE user_interactions.user_id = $1 AND user_interactions.watch_later = true",
      [id]
    );
    res.json(watchLaterMovies.rows);
  } catch (err) {
    console.error("Error fetching watch-later movies:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fetch user's liked movies
app.get("/user/:userId/liked-movies", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userExists.rows.length === 0) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const likedMovies = await pool.query(
      "SELECT movies.* FROM movies JOIN user_interactions ON movies.id = user_interactions.movie_id WHERE user_interactions.user_id = $1 AND user_interactions.liked = true",
      [userId]
    );

    res.json(likedMovies.rows);
  } catch (err) {
    console.error("Error fetching liked movies:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fetch recommendations
app.get("/recommendations", async (req, res) => {
  try {
    const { userId } = req.query;

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userExists.rows.length === 0) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Fetch recommendations using Python script
    const options = {
      args: [userId],
    };

    PythonShell.run("get_recommendations.py", options, (err, results) => {
      if (err) {
        console.error("Error running Python script:", err);
        return res
          .status(500)
          .json({ message: "Server error", error: err.message });
      }

      const recommendations = JSON.parse(results[0]);
      res.json(recommendations);
    });
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
