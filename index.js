const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(formidable());
app.use(cors());

// Permet l'accès aux variables d'environnement
require("dotenv").config();

// Connexion à la BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Connexion à l'espace de stockage cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);
const paymentRoutes = require("./routes/payment");
app.use(paymentRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "Page not found !" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started 🍺");
});
