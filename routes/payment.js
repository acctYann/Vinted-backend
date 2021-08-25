const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET); // Clé privé de stripe

// Déclaration de la route payment ---------------------------------------------------------------------------------------------
router.post("/payment", async (req, res) => {
  // Réception du token
  try {
    // Créer la transaction
    const response = await stripe.charges.create({
      amount: req.fields.price * 100, // Prix de la transaction en centime
      currency: "eur",
      desciption: `Paiement Vinted pour : ${req.fields.title}.`,
      // Envoie du token
      source: req.fields.token,
    });
    // Le paiement a fonctionné
    // On peut mettre à jour la base de données
    // On renvoie une réponse au client pour afficher un message de statut
    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
