const express = require("express");
const bodyParser = require("body-parser");
const { initDatabase } = require("./initDB");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
