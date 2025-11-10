const prisma = require("../../prisma");
const AppError = require("../utils/AppError");
const ExcelJs = require("exceljs");


const getBankDetailsService = async (query) => {
  const { bankId, monthYear } = query;

  const bankDetails = await prisma.myCompanyBankDetails.findUnique({
    where: {
      id: bankId ? Number(bankId) : undefined,
    },
  });

  if (!bankDetails) {
    throw new AppError("Bank details not found", 404);
  }

  const clientCompany = await prisma.clientCompany.findMany({
    where: {

      Employee:{
        some:{
          companyBankId: Number(bankId),
          SalaryDetails:{
            some:{
              month_of_salary: monthYear
            }
          }
        }

      },

    },
    include: {
      Employee: {
        where: {
          companyBankId: Number(bankId),
        },
        include:{
          SalaryDetails:true
        }
      },
    },
  });

  return clientCompany;
};



const getBankReportDemoService = async (query) => {
  const { bankId, monthYear, amountKey } = query;

  const bankDetails = await prisma.myCompanyBankDetails.findUnique({
    where: { id: bankId ? Number(bankId) : 0 },
  });
  if (!bankDetails) {
    throw new AppError("Bank details not found", 404);
  }

  const myCompany = await prisma.myCompany.findFirst({ where: {} });

  if (!myCompany) {
    throw new AppError("My company details not found", 404);
  }

  // Fetch employees with salary details for the given monthYear

  const employees = await prisma.employee.findMany({
    where: {
      companyBankId: Number(bankId),
      SalaryDetails: { some: { month_of_salary: monthYear } },
    },
    include: {
      SalaryDetails: {
        where: { month_of_salary: monthYear },
        take: 1,
      },
    },
  });

  const wb = new ExcelJs.Workbook();
  const ws = wb.addWorksheet("Transactions");

  // === Header rows ===
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = `${bankDetails.bankName} Bulk Upload Sheet`;
  ws.getCell("A1").font = { bold: true, size: 14 };

  ws.getCell("D1").value = "Bulk Upload Date";
  ws.getCell("E1").value = new Date().toLocaleDateString("en-IN");

  ws.getCell("F1").value = "Total Amount";
  const totalAmountCell = ws.getCell("G1");
  totalAmountCell.value = 0;

  ws.getCell("A2").value = "Debiting Account No";
  ws.getCell("B2").value = bankDetails.bankAccount || "";

  ws.getCell("C2").value = "Ordering Customer Name";
  ws.getCell("D2").value = myCompany.name || "";

  ws.getCell("E2").value = myCompany.address1;

  ws.addRow([])
  ws.addRow([])
  ws.addRow([])


  // === Table Header ===
  ws.addRow([
    "Seq",
    "Transaction Type",
    "Bene IFSC Code",
    "Bene A/C No.",
    "Bene Name",
    "Txn Ref #",
    "Amount",
    "Sender To Rcvr Info",
    "Add Info 1",
  ]).font = { bold: true, color: { argb: "FF0000" } };

  // === Employee rows ===
  let seq = 301;
  let totalAmount = 0;

  employees.forEach((emp, idx) => {
    const salaryModal = emp.SalaryDetails[0]?.salary_modal_with_data || {};
    const modalObj =
      typeof salaryModal === "string" ? JSON.parse(salaryModal) : salaryModal;

    const amount =
      Object.values(modalObj).find((step) => step.key === amountKey)?.value || 0;

    totalAmount += amount;

    const row = ws.addRow([
      seq++,
      "NEFT TRANSFER",
      emp.ifscCode || "",
      emp.bankAccount || "",
      emp.name || "",
      idx + 1, // Txn Ref #
      amount,
      "",
      "",
    ]);

    row.getCell(7).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF99CC" }, // highlight amount col
    };
  });

  totalAmountCell.value = totalAmount;
  return wb.xlsx.writeBuffer();
};


module.exports = {
  getBankDetailsService,
  getBankReportDemoService,
  getBankReportDemoService
};
