const express = require("express");
const router = express.Router();
const validate = require("../validation");
const { listingValidator } = require("../validation/listing.validation");
const { listingData, listingCategoryData } = require("../controller/listing.controller");


router.get("/", listingData);
router.get("/category", listingCategoryData);

module.exports = router;