import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

export async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("moviesDB");
    const movies = db.collection("movies");

    return { db, movies };
  } catch (err) {
    console.error("Connection error:", err);
  }
}
