const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");

// La requête arrivant vers cette route va devoir passer à travers :
// - le middleware isAuthenticated qui vérifie que celui qui fait la requête est bien identifié
// - le middleware fileUpload() qui permet à ma route de lire les form-data
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Je destructure les clefs suivantes de l'objet req.body
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // Je stocke la clef picture de req.body dans une variable picture
      const picture = req.files.picture;
      // Je converti l'image en quelquechose de lisible par cloudinary
      const readablePicture = convertToBase64(picture);

      // J'envoie l'image sur cloudinary et je récupère la réponse
      const result = await cloudinary.uploader.upload(readablePicture);

      // Je crée mon offre
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: result,
        owner: req.user,
      });

      // Je sauvegarde mon offre
      await newOffer.save();
      //   await newOffer.populate("owner", "account _id");
      // Je répond
      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // FIND
    // const regexp = new RegExp("pantalon", "i"); // Permet de créer une RegExp
    // Je vais chercher dans la collection Offer, toutes les offres dont la clef product_name contient "pantalon"
    // const offers = await Offer.find({ product_name: regexp }).select(
    //   "product_price product_name"
    // );

    // FIND AVEC FOURCHETTE DE PRIX
    // Je vais chercher dans la collection Offer, toutes les offres dont la clef product_price est supérieur ou égale à 50 et inférieur ou égale à 300
    // const offers = await Offer.find({
    //   product_price: {
    //     $lte: 300,
    //     $gte: 50,
    //   },
    //   product_name: new RegExp("pantalon", "i"),
    // }).select("product_price product_name");
    // $gte greater than or equal
    // $gt greater than
    // $lt lower than
    // $lte lower than or equal

    // SORT
    // Je vais chercher dans la collection Offer, toutes les offres et je les veux triées par clef product_price décroissante
    // const offers = await Offer.find()
    //   .sort({ product_price: -1 })
    //   .select("product_price product_name");
    // asc ou ascending ou 1 => croissant
    // desc ou descending ou -1 => décroissant

    // SKIP ET LIMIT
    // Je vais chercher dans la collection Offer, ignorer 0 offres et renvoyer 10 offres
    // const offers = await Offer.find()
    //   .skip(0)
    //   .limit(10)
    //   .select("product_price product_name");

    // ON PEUT TOUT CHAINER
    const offers = await Offer.find({
      product_name: new RegExp("pantalon", "i"),
      product_price: { $gte: 500, $lte: 1000 },
    })
      .sort({ product_price: "asc" })
      .skip(0)
      .limit(10)
      .select("product_price product_name");

    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
