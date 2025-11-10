const express = require("express");
const router = express.Router();
const validate = require("../validation");
const {
  excelUpload,
  getPayrollValidation,
  pdfUpload,
  downloadSingleSlipValidation,
  downloadBulkSlipValidation,
} = require("../validation/payroll.validation");
const {
  uploadEmployeeReportController,
  getDemoXlModalSheetController,
  getPayrollController,
  uploadPayrollModalController,
  getSinglePaySlipController,
  getBulkPaySlipController,
} = require("../controller/payroll.controller");
const auth = require("../middleware/auth.middleware");
const { addSalaryDesignModalDataValidation } = require("../validation/salary.validation");
const { salaryAddedBasedOnDesignModalController } = require("../controller/salary.controller");

router.post("/", auth, validate(getPayrollValidation), getPayrollController);


router.post(
  "/payroll-modal-add",
  auth,
  validate(addSalaryDesignModalDataValidation),
  salaryAddedBasedOnDesignModalController
);

router.get(
  "/single-payslip",
  validate(downloadSingleSlipValidation),
  getSinglePaySlipController
);
router.get(
  "/bulk-payslip",
  validate(downloadBulkSlipValidation),
  getBulkPaySlipController
);

router.post(
  "/report-upload",
  auth,
  excelUpload.single("file"),
  uploadEmployeeReportController
);

router.post("/report-payroll-modal", uploadPayrollModalController);

router.get("/report-demo", auth, getDemoXlModalSheetController);

// router.get(
//   "/payroll-generate",
//   auth,
//   validate(getPayrollValidation),
//   getPayrollController
// );

module.exports = router;
