
const { getInvoiceDetailsService } = require("../service/invoice.service");
const catchAsync = require("../utils/catchAsync");

const getInvoiceDetailsController = catchAsync(async (req, res) => {
  const invoiceDetails = await getInvoiceDetailsService(req.query);
  res.status(200).json({ data: invoiceDetails });
});

// const getBankReportDemoController = catchAsync(async (req, res) => {
//   const buffer = await getBankReportDemoService(req.query);
//   res.setHeader(
//     "Content-Disposition",
//     "attachment; filename=basic_salary_bulk_add_excel.xlsx"
//   );
//   res.setHeader(
//     "Content-Type",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   );
//   res.send(buffer);
// });

module.exports = {
  getInvoiceDetailsController,
  // getBankReportDemoController,
};
