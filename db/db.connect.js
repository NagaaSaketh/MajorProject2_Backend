const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.MONGO;

const initialiseDB = async () => {
  await mongoose
    .connect(mongoUri)
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.log("Error connecting to database.", err));
};

module.exports = {initialiseDB}