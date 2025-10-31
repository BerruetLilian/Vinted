const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middelwares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      if (
        req.body.description.length > 500 ||
        req.body.title > 50 ||
        req.body.price > 100000
      ) {
        return res.status(400).json({ message: "Invalid body format" });
      }
      const details = [
        { MARQUE: req.body.brand },
        { TAILLE: req.body.size },
        { ÉTAT: req.body.condition },
        { COULEUR: req.body.color },
        { EMPLACEMENT: req.body.city },
      ];
      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: details,
        product_image: null,
        owner: req.user._id,
      });
      if (req.files && req.files.picture) {
        const pictureToUpload = convertToBase64(req.files.picture);

        const result = await cloudinary.uploader.upload(pictureToUpload, {
          asset_folder: "/vinted/offers/",
          display_name: newOffer._id,
        });
        newOffer.product_image = result;
      }
      await newOffer.save();
      res.json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        product_image: newOffer.product_image,
        owner: {
          _id: req.user._id,
          account: req.user.account,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "server error", error: error.messsage });
    }
  }
);

router.put("/offer/:id", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(400).json({ message: "Offer not found" });
    }
    if (!offer.owner.equals(req.user._id)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (
      req.body.description.length > 500 ||
      req.body.title > 50 ||
      req.body.price > 100000
    ) {
      return res.status(400).json({ message: "Invalid body format" });
    }
    const details = [
      { MARQUE: req.body.brand },
      { TAILLE: req.body.size },
      { ÉTAT: req.body.condition },
      { COULEUR: req.body.color },
      { EMPLACEMENT: req.body.city },
    ];
    offer.product_name = req.body.title;
    offer.product_description = req.body.description;
    offer.product_price = req.body.price;
    offer.product_details = details;

    if (req.files && req.files.picture.md5 !== offer.product_image.etag) {
      const pictureToUpload = convertToBase64(req.files.picture);
      await cloudinary.uploader.destroy(offer.product_image.public_id);
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        asset_folder: "/vinted/offers/",
        display_name: offer._id,
      });
      offer.product_image = result;
    }
    await offer.save();
    res.json({
      _id: offer._id,
      product_name: offer.product_name,
      product_description: offer.product_description,
      product_price: offer.product_price,
      product_details: offer.product_details,
      product_image: offer.product_image,
      owner: {
        _id: req.user._id,
        account: req.user.account,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error", error: error.messsage });
  }
});

router.delete("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(400).json({ message: "Offer not found" });
    }
    if (!offer.owner.equals(req.user._id)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await cloudinary.uploader.destroy(offer.product_image.public_id);
    await offer.deleteOne();
    res.json({ message: "Offer deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error", error: error.messsage });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;
    const filter = {};
    let sortFilter;
    let limit = 3;
    let skip = 0;
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }
    if (priceMin && !priceMax) {
      filter.product_price = { $gte: priceMin };
    } else if (!priceMin && priceMax) {
      filter.product_price = { $lte: priceMax };
    } else if (priceMin && priceMax) {
      filter.product_price = { $gte: priceMin, $lte: priceMax };
    }
    if (sort === "price-desc") {
      sortFilter = { product_price: "desc" };
    }
    if (sort === "price-asc") {
      sortFilter = { product_price: "asc" };
    }
    if (page) {
      skip = limit * (page - 1);
    }
    const offers = await Offer.find(filter)
      .populate("owner", "account")
      .sort(sortFilter)
      .limit(limit)
      .skip(skip);
    const count = await Offer.countDocuments(filter);
    res.json({ count: count, offers: offers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error", error: error.messsage });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error", error: error.messsage });
  }
});

module.exports = router;
