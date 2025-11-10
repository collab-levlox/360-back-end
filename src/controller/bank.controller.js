const { getBankDetailsService, getBankReportDemoService } = require("../service/bank.service");
const catchAsync = require("../utils/catchAsync");

const getBankDetailsController = catchAsync(async (req, res) => {
  const bankDetails = await getBankDetailsService(req.query);
  res.status(200).json({ data: bankDetails });
});

const getBankReportDemoController = catchAsync(async (req, res) => {
  const buffer = await getBankReportDemoService(req.query);
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=basic_salary_bulk_add_excel.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

module.exports = {
  getBankDetailsController,
  getBankReportDemoController,
};
