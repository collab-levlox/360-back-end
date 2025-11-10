const express = require("express");
const router = express.Router();
const validate = require("../validation");

const auth = require("../middleware/auth.middleware");
const { getInvoiceDetailsController, getBankReportDemoController } = require("../controller/invoice.controller");
const { getInvoiceDetailsValidation } = require("../validation/invoice.validation");


router.get(
  "/details",
  auth,
  validate(getInvoiceDetailsValidation),
  getInvoiceDetailsController
);


// router.get(
//   "/report",
//   // auth,
//   validate(getBankReportDemoValidation),
//   getBankReportDemoController
// );

module.exports = router;
