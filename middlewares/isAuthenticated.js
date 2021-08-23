const User = require("../Models/User");

const isAuthenticated = async (req, res, next) => {
  //   console.log(req.headers); // authorization: 'Bearer tAdA60JtDU1XIN0V'

  //  Si j'ai bien reçu un token ?
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");

    // console.log(token); // tAdA60JtDU1XIN0V

    // Chercher dans la BDD le user qui possède ce token
    const user = await User.findOne({ token: token }).select("account _id");
    // console.log(user); // Select() = infos de user sans le salt, le hash et le token
    if (user) {
      // J'ajoute une clé user à l'objet req, contenant les infos du user
      req.user = user;
      return next();
    } else {
      res.status(400).json({ message: "Unauthorized" });
    }
  } else {
    res.status(400).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
