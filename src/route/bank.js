const express = require("express");
const router = express.Router();
const validate = require("../validation");

const auth = require("../middleware/auth.middleware");
const { getBankDetailsController, getBankReportDemoController } = require("../controller/bank.controller");
const { getBankDetailsValidation, getBankReportDemoValidation } = require("../validation/bank.validation");



router.get(
  "/details",
  auth,
  validate(getBankDetailsValidation),
  getBankDetailsController
);


router.get(
  "/report",
  // auth,
  validate(getBankReportDemoValidation),
  getBankReportDemoController
);

module.exports = router;
