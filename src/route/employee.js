const express = require("express");
const router = express.Router();
const validate = require("../validation");
const {
  employeeCreateValidation,
  employeeUpdateValidation,
  employeeListingValidation,
} = require("../validation/employee.validation");
const {
  employeeListingController,
  employeeCreationController,
  employeeUpdateController,
  bulkEmployeeUploadController,
  getDemoModalEmployeeReportController,
} = require("../controller/employee.controller");
const auth = require("../middleware/auth.middleware");
const { excelUpload } = require("../validation/payroll.validation");

router.get(
  "/",
  auth,
  validate(employeeListingValidation),
  employeeListingController
);

router.post(
  "/",
  auth,
  validate(employeeCreateValidation),
  employeeCreationController
);

router.put(
  "/",
  auth,
  validate(employeeUpdateValidation),
  employeeUpdateController
);

router.get("/employee-report-demo", getDemoModalEmployeeReportController);

router.post(
  "/employee-report-upload-file",
  auth,
  excelUpload.single("file"),
  bulkEmployeeUploadController
);

module.exports = router;
