const {
  ownCompanyListingService,
  ownCreateClientCompany,
  ownUpdateClientCompany,
} = require("../service/ownCompany.service");
const catchAsync = require("../utils/catchAsync");

const ownCompanyListingController = catchAsync(async (req, res) => {
  const result = await ownCompanyListingService(req.query);
  res.status(200).json({ data: result });
});

const ownCompanyCreationController = catchAsync(async (req, res) => {
  const result = await ownCreateClientCompany(req.body);
  res
    .status(201)
    .json({ data: result, message: "Company Created Successfully" });
});

const ownCompanyUpdateController = catchAsync(async (req, res) => {
  const result = await ownUpdateClientCompany(req.body);
  res
    .status(201)
    .json({ data: result, message: "Company Updated Successfully" });
});

module.exports = {
  ownCompanyCreationController,
  ownCompanyListingController,
  ownCompanyUpdateController,
};
