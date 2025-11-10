const prisma = require("../../prisma");
const AppError = require("../utils/AppError");
const ExcelJs = require("exceljs");

// const getBankDetailsService = async (query) => {
//   const { bankId, monthYear } = query;

//   const bankDetails = await prisma.myCompanyBankDetails.findUnique({
//     where: {
//       id: bankId ? Number(bankId) : 0,
//     },
//   });

//   if (bankDetails) {
//     throw new AppError("Bank details not found", 404);
//   }

//   const clientCompany = await prisma.clientCompany.findMany({
//     where: {},
//     include: {
//       Employee: {
//         where: {
//           companyBankId: Number(bankId),
//         },
//       },
//     },
//   });

//   return clientCompany;
// };

const getInvoiceDetailsService = async (query) => {
  const { clientCompanyId, monthYear } = query;
  let companies = [];

  try {
    // Helper to transform company into desired summary
    const transformCompany = (company) => {
      console.log(company, "company");

      const totalEmployees = company.Employee.length;

      const grouped = company.Employee.reduce((acc, emp) => {
        const designation = emp.salaryDesignModal?.name || "Unknown";

        if (!acc[designation]) {
          acc[designation] = {
            designation,
            count: 0,
            totals: {}, // hold sum by key
          };
        }

        acc[designation].count += 1;

        // Loop SalaryDesignModalData (step1, step2…)
        if (emp.SalaryDesignModalData) {
          Object.values(emp.SalaryDesignModalData).forEach((step) => {
            const { key, value, type } = step;
            const totalKey = `total_employee_${key}`;
            if (!acc[designation].totals[totalKey]) {
              acc[designation].totals[totalKey] = {
                key: totalKey,
                value: 0,
                type,
              };
            }
            acc[designation].totals[totalKey].value += Number(value || 0);
          });
        }

        return acc;
      }, {});

      // Convert to array with steps
      const result = Object.values(grouped).map((item) => {
        const steps = Object.values(item.totals);
        return {
          designation: item.designation,
          count: item.count,
          steps,
        };
      });

      return {
        companyId: company.id,
        companyName: company.name,
        totalEmployees,
        breakDown: result,
      };
    };

    // 1. If clientCompanyId is provided → fetch only that company
    if (clientCompanyId) {
      const company = await prisma.clientCompany.findUnique({
        where: { id: Number(clientCompanyId) },
        include: {
          Employee: {
            include: {
              salaryDesignModal: true,
              SalaryDetails: {
                where: { month_of_salary: monthYear },
              },
            },
          },
        },
      });

      if (!company) {
        throw new AppError("Client company not found", 404);
      }

      companies = [transformCompany(company)];
      return companies;
    }

    // 2. If clientCompanyId is null → fetch all companies
    const companyList = await prisma.clientCompany.findMany({
      where: {
        Employee: {
          some: {
            SalaryDetails: {
              some: {
                month_of_salary: monthYear,
              },
            },
          },
        },
        // Employee: {
        //   some: { salaryDesignModal: { some: { month_of_salary: monthYear } } },
        // },
      },
      include: {
        Employee: {
          include: {
            salaryDesignModal: true,
            SalaryDetails: {
              where: { month_of_salary: monthYear },
            },
          },
        },
      },
    });
    companies = companyList.map((company) => transformCompany(company));
  } catch (error) {
    console.log(error, "erp");

    throw new AppError(error.message, 500);
  }

  return companies;
};

// const getBankReportDemoService = async (query) => {
//   const { bankId, monthYear, amountKey } = query;

//   const bankDetails = await prisma.myCompanyBankDetails.findUnique({
//     where: { id: bankId ? Number(bankId) : 0 },
//   });
//   if (!bankDetails) {
//     throw new AppError("Bank details not found", 404);
//   }

//   const myCompany = await prisma.myCompany.findFirst({ where: {} });

//   if (!myCompany) {
//     throw new AppError("My company details not found", 404);
//   }

//   // Fetch employees with salary details for the given monthYear

//   const employees = await prisma.employee.findMany({
//     where: {
//       companyBankId: Number(bankId),
//       SalaryDetails: { some: { month_of_salary: monthYear } },
//     },
//     include: {
//       SalaryDetails: {
//         where: { month_of_salary: monthYear },
//         take: 1,
//       },
//     },
//   });

//   const wb = new ExcelJs.Workbook();
//   const ws = wb.addWorksheet("Transactions");

//   // === Header rows ===
//   ws.mergeCells("A1:C1");
//   ws.getCell("A1").value = `${bankDetails.bankName} Bulk Upload Sheet`;
//   ws.getCell("A1").font = { bold: true, size: 14 };

//   ws.getCell("D1").value = "Bulk Upload Date";
//   ws.getCell("E1").value = new Date().toLocaleDateString("en-IN");

//   ws.getCell("F1").value = "Total Amount";
//   const totalAmountCell = ws.getCell("G1");
//   totalAmountCell.value = 0;

//   ws.getCell("A2").value = "Debiting Account No";
//   ws.getCell("B2").value = bankDetails.bankAccount || "";

//   ws.getCell("C2").value = "Ordering Customer Name";
//   ws.getCell("D2").value = myCompany.name || "";

//   ws.getCell("E2").value = myCompany.address1;

//   ws.addRow([])
//   ws.addRow([])
//   ws.addRow([])

//   // === Table Header ===
//   ws.addRow([
//     "Seq",
//     "Transaction Type",
//     "Bene IFSC Code",
//     "Bene A/C No.",
//     "Bene Name",
//     "Txn Ref #",
//     "Amount",
//     "Sender To Rcvr Info",
//     "Add Info 1",
//   ]).font = { bold: true, color: { argb: "FF0000" } };

//   // === Employee rows ===
//   let seq = 301;
//   let totalAmount = 0;

//   employees.forEach((emp, idx) => {
//     const salaryModal = emp.SalaryDetails[0]?.salary_modal_with_data || {};
//     const modalObj =
//       typeof salaryModal === "string" ? JSON.parse(salaryModal) : salaryModal;

//     const amount =
//       Object.values(modalObj).find((step) => step.key === amountKey)?.value || 0;

//     totalAmount += amount;

//     const row = ws.addRow([
//       seq++,
//       "NEFT TRANSFER",
//       emp.ifscCode || "",
//       emp.bankAccount || "",
//       emp.name || "",
//       idx + 1, // Txn Ref #
//       amount,
//       "",
//       "",
//     ]);

//     row.getCell(7).fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "FFFF99CC" }, // highlight amount col
//     };
//   });

//   totalAmountCell.value = totalAmount;
//   return wb.xlsx.writeBuffer();
// };

module.exports = {
  getInvoiceDetailsService,
  // getBankDetailsService,
  // getBankReportDemoService,
  // getBankReportDemoService
};
