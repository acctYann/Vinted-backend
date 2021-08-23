const express = require("express");
const router = express.Router();

// Import des models
const User = require("../Models/User");
const Offer = require("../Models/Offer");

// Import uid2 et crypto-js pour encrypter le mot de passe
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Déclaration de la route signup ---------------------------------------------------------------------------------------------
router.post("/user/signup", async (req, res) => {
  try {
    // Recherche dans la BDD. Est-ce qu'un utilisateur possède cet email ?
    const user = await User.findOne({ email: req.fields.email });

    // Si oui, on renvoie un message et on ne procède pas à l'inscription
    if (user) {
      res.status(400).json({ message: "This email already has an account" });

      // Sinon, on passe à la suite...
    } else {
      // L'utilisateur a-t-il bien envoyé les informations requises ?
      if (req.fields.username && req.fields.email && req.fields.password) {
        // Si oui, on peut créer ce nouvel utilisateur

        // Etape 1 : encrypter le mot de passe
        const salt = uid2(16);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(16);

        // Etape 2 : créer le nouvel utilisateur
        // Nous avons besoin du model User ici
        const newUser = new User({
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          email: req.fields.email,
          salt: salt,
          hash: hash,
          token: token,
        });

        // Etape 3 : sauvegarde ce nouvel utilisateur dans la BDD
        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          account: newUser.account,
          email: newUser.email,
          token: newUser.token,
        });
      } else {
        // L'utilisateur n'a pas envoyé les informations requises ?
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Déclaration de la route login ---------------------------------------------------------------------------------------------
router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.fields);
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      // L'utilisateur est t'il bien rentré le bon mot de passe ?
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          account: user.account,
          token: user.token,
        });
      } else {
        // L'utilisateur n'a pas envoyé le bon mot de passe
        res.status(400).json({ message: "Unauthorized" });
      }
    } else {
      // Le email de l'utilisateur n'est pas trouvé
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
