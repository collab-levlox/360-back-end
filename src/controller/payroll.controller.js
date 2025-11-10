const {
  uploadEmployeeReportService,
  getDemoXlModalSheetService,
  getPayrollService,
  uploadPayrollModalService,
  getSinglePaySlipService,
  getBulkPaySlipService,
} = require("../service/payroll.service");
const catchAsync = require("../utils/catchAsync");

const uploadEmployeeReportController = catchAsync(async (req, res) => {
  const result = await uploadEmployeeReportService(req, res);
  res.status(200).json({
    data: result,
    message: "Salary report has been fetched successfully",
  });
});

const uploadPayrollModalController = catchAsync(async (req, res) => {
  const result = await uploadPayrollModalService(req, res);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="salary-slip-payroll.pdf"`,
  });
  res.send(result);
});

const getDemoXlModalSheetController = catchAsync(async (req, res) => {
  const buffer = await getDemoXlModalSheetService(req);
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=dummy_payroll_template.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

// const getPayrollController = catchAsync(async (req, res) => {
//   const { adharNumber, monthYear } = req.query;
//   const htmlPdf = await getPayrollService({ adharNumber, monthYear });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename=payroll-${adharNumber}-${monthYear}.pdf`
//   );
//   res.send(htmlPdf);
// });

const getPayrollController = catchAsync(async (req, res) => {
  const result = await getPayrollService(req.body);
  res.status(200).json({
    data: result,
    message: "Payroll data has been fetched successfully",
  });
});

const getSinglePaySlipController = catchAsync(async (req, res) => {
  const htmlPdf = await getSinglePaySlipService(req.query);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=single-payroll-${req.query.empCode}-${req.query.monthYear}.pdf`
  );
  res.send(htmlPdf);
});

const getBulkPaySlipController = catchAsync(async (req, res) => {
  const htmlPdf = await getBulkPaySlipService(req.query);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=bulk-payroll-${req.query.clientCompanyId}-${req.query.monthYear}.pdf`
  );
  res.send(htmlPdf);
});

module.exports = {
  uploadEmployeeReportController,
  getDemoXlModalSheetController,
  getPayrollController,
  uploadPayrollModalController,
  getSinglePaySlipController,
  getBulkPaySlipController,
};
