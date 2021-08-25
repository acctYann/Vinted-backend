const express = require("express");
const router = express.Router();

// Import du package cloudinary
const cloudinary = require("cloudinary").v2;

// Import des models
const Offer = require("../Models/Offer");
const User = require("../Models/User");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

// Déclaration de la route publish ---------------------------------------------------------------------------------------------
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  // Route qui permet de poster une nouvelle annonce
  try {
    // Destructuring
    const { title, description, price, brand, size, condition, color, city } =
      req.fields;
    // console.log(req.fields);

    if (title.length > 50) {
      res.status(400).json({
        message: "Your title must be shorter",
      });
    } else if (description.length > 500) {
      res.status(400).json({
        message: "Your description must be shorter",
      });
    } else if (Number(price) > 100000) {
      res.status(400).json({
        message: "You should put a lower price",
      });
    } else {
      if (title && price && req.files.picture.path) {
        // Création de la nouvelle annonce (sans l'image)
        const newOffer = new Offer({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            { MARQUE: brand },
            { TAILLE: size },
            { ÉTAT: condition },
            { COULEUR: color },
            { EMPLACEMENT: city },
          ],
          owner: req.user,
        });

        // Envoi de l'image à cloudinary
        // console.log(req.files);
        const result = await cloudinary.uploader.upload(
          req.files.picture.path,
          {
            folder: `vinted/offers/${newOffer._id}`,
          }
        );

        // console.log(result);
        // Ajoute result à product_image
        newOffer.product_image = result;

        // Sauvegarder l'annonce
        await newOffer.save();
        // console.log(newOffer);
        res.status(200).json(newOffer);
      } else {
        res
          .status(400)
          .json({ message: "Title, price and picture are required" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Déclaration de la route offers ---------------------------------------------------------------------------------------------
// Filtrer les offres
// Route qui nous permet de récupérer une liste d'annonces, en fonction de filtres
// Si aucun filtre n'est envoyé, cette route renverra l'ensemble des annonces
router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet vide, où on stockera les requêtes filtrées par titre et par prix
    let filters = {};

    // Si on veut trouver une offre par titre
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
      // Le marqueur "i" permet d'effectuer une recherche non sensible à la casse
    }

    // Si on veut trouver une offre par prix min
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin, // $gte = greater than or equal (>=)
      };
    }

    // Si on veut trouver une offre par prix max
    if (req.query.priceMax) {
      // On vérifie si filters.product_price existe
      if (filters.product_price) {
        // Si oui, on ajoute une clé $lte à l'objet filters.product_price
        filters.product_price.$lte = req.query.priceMax;
        // Si non, on crée un nouveau objet
      } else {
        filters.product_price = {
          $lte: req.query.priceMax, // $lte = less than or equal (<=)
        };
      }
    }

    // Création d'un objet vide, où on stockera les requêtes filtrées par prix asc ou desc
    // Si un objet est passé, les valeurs autorisées sont asc, desc, ascending, descending, 1 et -1.
    let sort = {};

    // Pour touver une offre par prix asc
    if (req.query.sort === "price-asc") {
      sort = { product_price: 1 }; // ou asc
      // Pour trouver une offre par prix desc
    } else if (req.query.sort === "price-desc") {
      sort = { product_price: -1 }; // ou desc
    }

    // Gérér la pagination avec 'limit' et 'skip'
    // Les queries sont des strings et les méthodes 'limit' et 'skip' reçoivent un number en paramètre
    let limit = Number(req.query.limit);

    let page;
    // Si ce paramètre n'est pas transmis, il faut forcer l'affichage de la 1ère page
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    const offers = await Offer.find(filters)
      .populate({
        path: "owner", // La clé où je veux des infos
        select: "account", // La clé que je veux retourner au client
      })
      .sort(sort)
      .skip((page - 1) * limit) // Ignorer les x résultats
      .limit(limit) // Renvoyer y résultats
      .select("product_name product_price"); // Sélectionner seulement les clés qu'on veut dans notre response

    // Pour afficher la quantité totale d'offres
    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Déclaration de la route offer ---------------------------------------------------------------------------------------------
// Chercher une offre par id
// Permettra de récupérer les détails concernant une annonce, en fonction de son id
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Déclaration de la route update ---------------------------------------------------------------------------------------------
// Mettre à jour une offre
router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  try {
    // On cherche l'offre à modifier par son id
    const offerToModify = await Offer.findById(req.params.id);

    // On vérifie si les champs à modifier sont renseignés
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }

    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }

    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }

    // Modifier le tableau product_details
    const details = offerToModify.product_details;

    // On parcourt chaque élément du tableau pour pouvoir les modifier
    for (let i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (req.fields.brand) {
          details[i].MARQUE = req.fields.brand;
        }
      }

      if (details[i].TAILLE) {
        if (req.fields.size) {
          details[i].TAILLE = req.fields.size;
        }
      }

      if (details[i].ÉTAT) {
        if (req.fields.condition) {
          details[i].ÉTAT = req.fields.condition;
        }
      }

      if (details[i].COULEUR) {
        if (req.fields.color) {
          details[i].COULEUR = req.fields.color;
        }
      }

      if (details[i].EMPLACEMENT) {
        if (req.fields.city) {
          details[i].EMPLACEMENT = req.fields.city;
        }
      }
    }

    // Pour que les modifications du tableau soient prises en compte
    offerToModify.markModified("product_details");

    // Modifier l'image
    if (req.files.picture) {
      // Envoyer la nouvelle image à cloudinary
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        folder: `vinted/offers/${offerToModify._id}`,
      });
      offerToModify.product_image = result;
    }

    await offerToModify.save();

    res.status(200).json({ message: "Offer modified successfully !" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Déclaration de la route delete ---------------------------------------------------------------------------------------------
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    // On cherche l'offre à supprimer par son id
    const offerToDelete = await Offer.findById(req.params.id);

    // Supprimer ce qu'il y a dans le dossier cloudinary
    await cloudinary.api.delete_resources_by_prefix(
      `vinted/offers/${req.params.id}`
    );

    // Ensuite, on supprime le dossier cloudinary
    await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);

    await offerToDelete.delete();

    res.status(200).json({ message: "Offer deleted successfully !" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
