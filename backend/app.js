
const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const ngoRoutes = require("./routes/ngoRoutes");
const projectRoutes = require("./routes/projectRoutes");
const donationRoutes = require("./routes/donationRoutes");
app.use("/api/donations", donationRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/projects", projectRoutes);

module.exports = app;