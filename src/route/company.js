const express = require("express");
const router = express.Router();
const validate = require("../validation");
const {
  companyListingValidation,
  companyCreateValidation,
  companyUpdateValidation,
  companyAssignValidation,
} = require("../validation/company.validation");
const {
  companyListingController,
  companyCreationController,
  mainCompanyListingController,
  companyUpdateController,
  companyEmpAssignController,
} = require("../controller/company.controller");
const auth = require("../middleware/auth.middleware");

router.get(
  "/",
  auth,
  validate(companyListingValidation),
  companyListingController
);

router.get("/main-company", auth, mainCompanyListingController);

router.post(
  "/",
  auth,
  validate(companyCreateValidation),
  companyCreationController
);

router.put(
  "/",
  auth,
  validate(companyUpdateValidation),
  companyUpdateController
);

router.post(
  "/add-employee",
  auth,
  validate(companyAssignValidation),
  companyEmpAssignController
);

module.exports = router;
