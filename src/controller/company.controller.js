const {
  companyListingService,
  createClientCompany,
  listMainCompanyService,
  updateClientCompany,
  companyEmployeeAssignService,
} = require("../service/company.service");
const catchAsync = require("../utils/catchAsync");

const companyListingController = catchAsync(async (req, res) => {
  const result = await companyListingService(req.query);
  res.status(200).json({ data: result });
});

const companyCreationController = catchAsync(async (req, res) => {
  const result = await createClientCompany(req.body);
  res
    .status(201)
    .json({ data: result, message: "Company Created Successfully" });
});

const mainCompanyListingController = catchAsync(async (req, res) => {
  const result = await listMainCompanyService(req.query?.id);
  res.status(201).json({ data: result });
});

const companyEmpAssignController = catchAsync(async (req, res) => {
  const result = await companyEmployeeAssignService(req.body);
  res
    .status(201)
    .json({ data: result, message: "Employee Assigned Successfully" });
});

const companyUpdateController = catchAsync(async (req, res) => {
  const result = await updateClientCompany(req.body);
  res
    .status(201)
    .json({ data: result, message: "Company Updated Successfully" });
});

module.exports = {
  companyListingController,
  companyCreationController,
  mainCompanyListingController,
  companyUpdateController,
  companyEmpAssignController,
};
