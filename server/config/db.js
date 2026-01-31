const mongoose = require("mongoose");

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
    console.log("Database name:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed ");
    console.error(error.message);
    process.exit(1); // stop server if DB fails
  }
}

module.exports = connectDB;
