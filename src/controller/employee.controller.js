const { json } = require("express");
const {
  employeeListingService,
  createEmployee,
  updateEmployee,
  bulkEmployeeUploadService,
  getDemoModalEmployeeReportService,
} = require("../service/employee.service");
const catchAsync = require("../utils/catchAsync");

const employeeListingController = catchAsync(async (req, res) => {
  const result = await employeeListingService(req.query);
  res.status(200).json({ data: result });
});

const employeeCreationController = catchAsync(async (req, res) => {
  const result = await createEmployee(req.body);
  res
    .status(201)
    .json({ data: result, message: "Created Employee Successfully" });
});

const employeeUpdateController = catchAsync(async (req, res) => {
  const result = await updateEmployee(req.body);
  res
    .status(201)
    .json({ data: result, message: "Employee Updated Successfully" });
});

const getDemoModalEmployeeReportController = catchAsync(async (req, res) => {
  const buffer = await getDemoModalEmployeeReportService();
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=employee_details_add_template.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

const bulkEmployeeUploadController = catchAsync(async (req, res) => {
  const fileBuffer = req.file.buffer;

  const result = await bulkEmployeeUploadService(fileBuffer, res);

  res
    .status(201)
    .json({  ...result, message: "Employee Uploaded Successfully" });
});

module.exports = {
  employeeListingController,
  employeeCreationController,
  employeeUpdateController,
  bulkEmployeeUploadController,
  getDemoModalEmployeeReportController,
};
