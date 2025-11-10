const express = require("express");
const { movies } = require("./src/movies");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
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
});

app.get("/movies", (req, res) => {
  res.json(movies);
});

app.post("/movies", (req, res) => {
  const { title, director, year } = req.body;
  const newMovie = {
    id: movies.length + 1,
    title,
    director,
    year,
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

app.get("/movies/:id", (req, res) => {
  const movie = movies.find((m) => m.id === parseInt(req.params.id));
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

app.put("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, director, year } = req.body;
  const movie = movies.find((m) => m.id === id);

  if (movie) {
    movie.title = title ?? movie.title;
    movie.director = director ?? movie.director;
    movie.year = year ?? movie.year;
    res.json(movie);
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

app.delete("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex((m) => m.id === id);

  if (index !== -1) {
    const deleted = movies.splice(index, 1);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: "Movie not found" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
