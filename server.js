import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

// Load environment variables
dotenv.config();

const app = express();
let moviesCollection; // Will hold the MongoDB collection

// Middleware
app.use(morgan("dev")); // HTTP request logging in development format
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const movies = await moviesCollection.find({}).toArray();
    const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Movies</title></head>
      <body>
        <h1>Movies</h1>
        <ul>
          ${movies
            .map((m) => `<li>${m.title} (${m.year}) - ${m.director}</li>`)
            .join("")}
        </ul>
      </body>
    </html>
  `;
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/movies", async (req, res) => {
  try {
    const { title, year, director } = req.query;

    // Build query object for MongoDB
    const query = {};

    // Apply title filter (case-insensitive partial match using regex)
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    // Apply year filter (exact match)
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        query.year = yearNum;
      }
    }

    // Apply director filter (case-insensitive partial match using regex)
    if (director) {
      query.director = { $regex: director, $options: "i" };
    }

    const movies = await moviesCollection.find(query).toArray();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.post("/movies", async (req, res) => {
  try {
    const { title, director, year } = req.body;

    // Validation: Check if all required fields are present
    if (!title || !director || !year) {
      return res.status(400).json({
        error: "Bad Request",
        message: "All fields (title, director, year) are required",
      });
    }

    // Validation: Check if title and director are not empty after trimming
    if (!title.trim() || !director.trim()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Title and director cannot be empty",
      });
    }

    // Validation: Check if year is a number
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Year must be a valid number",
      });
    }

    // Validation: Check if year is in a reasonable range (1888 - current year + 5 for upcoming releases)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1888 || yearNum > currentYear + 5) {
      return res.status(400).json({
        error: "Bad Request",
        message: `Year must be between 1888 and ${currentYear + 5}`,
      });
    }

    // Generate new ID by finding the max ID and adding 1
    const allMovies = await moviesCollection.find({}).toArray();
    const newId =
      allMovies.length > 0 ? Math.max(...allMovies.map((m) => m.id)) + 1 : 1;

    // Create new movie with the next available ID
    const newMovie = {
      id: newId,
      title: title.trim(),
      director: director.trim(),
      year: yearNum,
    };

    await moviesCollection.insertOne(newMovie);
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: "Failed to create movie" });
  }
});

app.get("/movies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const movie = await moviesCollection.findOne({ id });

    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ error: "Movie not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

app.put("/movies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, director, year } = req.body;

    // Check if movie exists
    const movie = await moviesCollection.findOne({ id });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Build update object
    const updateFields = {};

    // Validation: If year is provided, validate it
    if (year !== undefined) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Year must be a valid number",
        });
      }

      const currentYear = new Date().getFullYear();
      if (yearNum < 1888 || yearNum > currentYear + 5) {
        return res.status(400).json({
          error: "Bad Request",
          message: `Year must be between 1888 and ${currentYear + 5}`,
        });
      }

      updateFields.year = yearNum;
    }

    // Update other fields if provided
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Title cannot be empty",
        });
      }
      updateFields.title = title.trim();
    }

    if (director !== undefined) {
      if (!director.trim()) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Director cannot be empty",
        });
      }
      updateFields.director = director.trim();
    }

    // Update the movie in MongoDB
    await moviesCollection.updateOne({ id }, { $set: updateFields });

    // Fetch and return the updated movie
    const updatedMovie = await moviesCollection.findOne({ id });
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie" });
  }
});

app.delete("/movies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await moviesCollection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(204).send(); // 204 No Content - successful deletion with no response body
  } catch (error) {
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// Catch-all route for undefined endpoints (must be last)
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB
    const { movies } = await connectDB();
    moviesCollection = movies;

    // Create sample data if the collection is empty
    const count = await moviesCollection.countDocuments();
    if (count === 0) {
      console.log("No movies found. Creating sample data...");
      const sampleMovies = [
        {
          id: 1,
          title: "Inception",
          director: "Christopher Nolan",
          year: 2010,
        },
        { id: 2, title: "The Matrix", director: "The Wachowskis", year: 1999 },
        { id: 3, title: "Parasite", director: "Bong Joon-ho", year: 2019 },
      ];
      await moviesCollection.insertMany(sampleMovies);
      console.log("Sample data created successfully!");
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
