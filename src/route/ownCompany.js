const express = require("express");
const router = express.Router();
const validate = require("../validation");
const {
  updateOwnCompanyValidation,
  createOwnCompanyValidation,
  ownCompanyDataGet,
} = require("../validation/ownCompany.validation");

const {
  ownCompanyListingController,
  ownCompanyCreationController,
  ownCompanyUpdateController,
} = require("../controller/ownCompany.controller");
const auth = require("../middleware/auth.middleware");

router.get(
  "/",
  auth,
  ownCompanyListingController
);

router.post(
  "/",
  auth,
  validate(createOwnCompanyValidation),
  ownCompanyCreationController
);

router.put(
  "/",
  auth,
  validate(updateOwnCompanyValidation),
  ownCompanyUpdateController
);

module.exports = router;
