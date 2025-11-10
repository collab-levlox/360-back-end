const express = require("express");
const router = express.Router();
const validate = require("../validation");
const {
  getSalaryDesignAddDemoXlModalSheetController,
  salaryDesignModalCreateController,
  attendanceDesignModalCreateController,
  getSalaryDesignModalListController,
  salaryAddedBasedOnDesignModalController,
  salaryBaseOnDesignModalController,
  uploadBasicDataSalaryDesignModalController,
  getAttendanceDesignAddDemoXlModalSheetController,
  uploadAttendanceDataDesignModalController,
  getSalaryDetailsController,
} = require("../controller/salary.controller");
const auth = require("../middleware/auth.middleware");
const {
  salaryModalValidation,
  attendanceModalValidation,
  getListDesignModalValidation,
  addSalaryDesignModalDataValidation,
  getSalaryDetailDemoReportValidation,
  uploadAttendanceModalValidation,
  getSalaryDetailsValidation,
} = require("../validation/salary.validation");
const { excelUpload } = require("../validation/payroll.validation");

router.get(
  "/modal-list",
  auth,
  validate(getListDesignModalValidation),
  getSalaryDesignModalListController
);

router.post(
  "/salary-modal",
  auth,
  validate(salaryModalValidation),
  salaryDesignModalCreateController
);

router.post(
  "/attendance-modal",
  auth,
  validate(attendanceModalValidation),
  attendanceDesignModalCreateController
);

router.post(
  "/salary-basic-add",
  auth,
  validate(addSalaryDesignModalDataValidation),
  salaryBaseOnDesignModalController
);
router.post(
  "/salary-attendance-add",
  auth,
  validate(addSalaryDesignModalDataValidation),
  salaryAddedBasedOnDesignModalController
);

router.get(
  "/report-demo",
  validate(getSalaryDetailDemoReportValidation),
  getSalaryDesignAddDemoXlModalSheetController
);

router.get(
  "/report-demo-attendance",
  validate(getSalaryDetailDemoReportValidation),
  getAttendanceDesignAddDemoXlModalSheetController
);

router.post(
  "/salary-report-upload-file",
  auth,
  validate(getSalaryDetailDemoReportValidation, "query"),
  excelUpload.single("file"),
  uploadBasicDataSalaryDesignModalController
);

router.post(
  "/attendance-report-upload-file",
  auth,
  validate(uploadAttendanceModalValidation, "query"),
  excelUpload.single("file"),
  uploadAttendanceDataDesignModalController
);

router.get(
  "/get-salary-details",
  auth,
  validate(getSalaryDetailsValidation),
  getSalaryDetailsController
);

module.exports = router;
