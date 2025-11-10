const prisma = require("../../prisma");
const AppError = require("../utils/AppError");
const xlsx = require("xlsx");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const { roundValue } = require("../utils");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

const { isValidNumber, capitalizeWords } = require("../utils/utility");
const uploadEmployeeReportService = async (req, res) => {
  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  const validAadharCodes = [];
  const validUserByAadhar = {};

  data.forEach((row, index) => {
    const aadhar = String(row.Aadhar_Number)
      .toString()
      .replace(/[^0-9]/g, "")
      .trim();
    if (!aadhar) {
      throw new AppError(`Aadhar number is missing in row ${index + 2}`, 400);
    } else if (!/^[2-9]{1}[0-9]{11}$/.test(aadhar)) {
      throw new AppError(`Aadhar number is not valid in row ${index + 2}`, 400);
    } else {
      validAadharCodes.push(aadhar);
      validUserByAadhar[aadhar] = row;
    }
  });

  return [];

  const employees = await prisma.employee.findMany({
    where: {
      adharCode: { in: validAadharCodes },
    },
  });

  const employeeMap = new Map(employees.map((emp) => [emp.adharCode, emp]));

  const salaryArray = [];
  const attendanceArray = [];

  const result = data.map((row, index) => {
    const aadhar = String(row.Aadhar_Number)
      .replace(/[^0-9]/g, "")
      .trim();
    const emp = employeeMap.get(aadhar);

    if (!emp) {
      throw new AppError(`Row ${index + 2} Employee not found`, 400);
    }

    const month = row.month_year;

    const basicVDA = parseFloat(row.Basic_VDA) || 0;
    const otAmount = parseFloat(row.OT_Hours_Amount) || 0;
    const totalHoursOfWorkingOT = parseFloat(row.OT_Hours) || 0;
    const totalOTamount = totalHoursOfWorkingOT * otAmount || 0;
    const bata = parseFloat(row.BATA) || 0;
    const epfPercent = parseFloat(row.EPF_Percentage) || 0;
    const esicPercent = parseFloat(row.ESIC_Percentage) || 0;
    const ptAmount = parseFloat(row.PT) || 0;
    const abAmount = parseFloat(row.Ab_AMOUNT) || 0;
    const totalWorkingDays = parseInt(row.TOTAL_WORKING_DAYS) || 0;
    if (totalWorkingDays == 0 && totalWorkingDays) {
      throw new AppError(
        `working day should be valid in row ${index + 2}`,
        400
      );
    }
    const absentDays = parseInt(row.ABSENT_DAYS) || 0;
    const perDaySalary = basicVDA / totalWorkingDays;
    const epfAmount = (basicVDA * epfPercent) / 100;
    const esicAmount = (basicVDA * esicPercent) / 100;

    let netPay = parseFloat(
      basicVDA + otAmount + bata - (epfAmount + esicAmount + ptAmount)
    );

    let totalDeduction = epfAmount + esicAmount + abAmount + ptAmount;

    const absentDaysSalary = perDaySalary * absentDays;

    if (absentDays != 0 && absentDays) {
      netPay = netPay - absentDaysSalary;
      totalDeduction = totalDeduction + absentDaysSalary;
    }

    console.log(
      { perDaySalary, absentDays, netPay, absentDaysSalary },
      "absentDays"
    );

    const overAllSalary =
      basicVDA +
      totalOTamount +
      bata +
      epfAmount +
      esicAmount +
      ptAmount +
      abAmount;
    salaryArray.push({
      employeeAdharId: emp.adharCode,
      basicPay: basicVDA,
      monthOfSalary: month,
      otherAllowance: 0,
      OtHoursAmount: totalOTamount,
      betaAmount: bata,
      epfAmount,
      esicAmount,
      ptAmount,
      AbAmount: abAmount,
      netPay: roundValue(netPay),
      absentDaysAmount: roundValue(absentDaysSalary),
    });

    attendanceArray.push({
      employeeId: emp.id,
      month,
      totalDays: 30,
      totalWorkingDays,
      absentDays,
      otHours: totalHoursOfWorkingOT,
    });

    return {
      row: index + 2,
      name: emp.name,
      empCode: emp.empCode,
      aadharCode: emp.adharCode,
      employeeAdharId: emp.adharCode,
      basicPay: basicVDA,
      monthOfSalary: month,
      otherAllowance: 0,
      OtHoursAmount: totalOTamount,
      betaAmount: bata,
      epfAmount,
      esicAmount,
      ptAmount,
      AbAmount: abAmount,
      netPay,
      totalDeduction,
      overAllSalary,
      employeeId: emp.id,
      month,
      totalDays: 30,
      totalWorkingDays,
      absentDays,
      otHours: totalHoursOfWorkingOT,
      absentDaysSalary,
      ...row,
    };
  });

  if (salaryArray.length > 0) {
    await prisma.salary
      .createMany({
        data: salaryArray,
        skipDuplicates: true,
      })
      .catch((err) => {
        console.log(err, "err");
        throw new AppError("Error in salary creation", 500);
      });
  }
  if (attendanceArray.length > 0) {
    await prisma.attendance
      .createMany({
        data: attendanceArray,
        skipDuplicates: true,
      })
      .catch((err) => {
        console.log(err, "err");
        throw new AppError("Error in attendance creation", 500);
      });
  }

  return result;
};

const uploadPayrollModalService = async (req, res) => {
  console.log(req.file, "fil");

  const templatePath = req.file.path;
  console.log(templatePath, "templatePath");

  const pdfBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  form.getTextField("employeeName").setText("Sakrhi");
  form.getTextField("netSalary").setText(0);
  form.getTextField("month").setText("09-34");

  form.flatten();
  const newPdfBytes = await pdfDoc.save();
  return newPdfBytes;
};

const getDemoXlModalSheetService = async (req) => {
  // const data = [
  //   {
  //     Aadhar_Number: "123456789012",
  //     month_year: "08-2025",
  //     Basic_VDA: 15357,
  //     OT_Hours_Amount: 100,
  //     OT_Hours: 3.1,
  //     BATA: 90,
  //     EPF_Percentage: 12,
  //     ESIC_Percentage: 0.75,
  //     PT: 200,
  //     Ab_AMOUNT: 0,
  //     TOTAL_WORKING_DAYS: 23,
  //     ABSENT_DAYS: 3,
  //   },
  // ];

  // const worksheet = xlsx.utils.json_to_sheet(data);
  // const workbook = xlsx.utils.book_new();
  // xlsx.utils.book_append_sheet(workbook, worksheet, "PayrollTemplate");

  // const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  // return buffer;

  const companies = [
    { id: 1, name: "ABC Pvt Ltd" },
    { id: 2, name: "XYZ Industries" },
    { id: 3, name: "Tech Solutions" },
  ];

  const data = [
    {
      Name: "John Doe",
      Emp_Code: "EMP001",
      Aadhar_Number: "123456789012",
      UAN_Number: "100200300400",
      Bank_Account: "9876543210",
      IFSC_Code: "SBIN0001234",
      Gender: "Male",
      EPF_Number: "TN12345",
      ESIC_Number: "ESIC56789",
      Mobile_Number: "9876543210",
      Secondary_Mobile: "",
      Address: "123 Main Street",
      City: "Chennai",
      Pin_Code: "600001",
      State: "Tamil Nadu",
      Country: "India",
      Email: "john.doe@example.com",
      Blood_Group: "O+",
      Employee_Status: "ACTIVE",
      ClientCompany_Id: "",
    },
  ];

  const wsEmployees = xlsx.utils.json_to_sheet(data);

  wsEmployees["!cols"] = Object.keys(data[0]).map((key) => ({
    wch: Math.max(key.length, 20),
  }));

  const wsCompanies = xlsx.utils.aoa_to_sheet([
    ["ID", "Company Name"],
    ...companies.map((c) => [c.id, c.name]),
  ]);

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, wsEmployees, "EmployeeMaster");
  xlsx.utils.book_append_sheet(wb, wsCompanies, "Companies");

  const fs = require("fs");
  xlsx.writeFile(wb, "EmployeeMasterTemplate.xlsx");
};

// const getPayrollService = async ({ adharNumber, monthYear }) => {
//   const employee = await prisma.employee.findUnique({
//     where: { adharCode: adharNumber },
//   });

//   if (!employee) throw new AppError("Employee not found", 404);

//   const salary = await prisma.salaryDetails.findFirst({
//     where: {
//       // monthOfSalary: monthYear,
//     },
//   });

//   if (!salary) throw new AppError("Salary record not found", 404);

//   const clientCompanyInfo = !employee.resourcesTo
//     ? null
//     : await prisma.clientCompany.findFirst({
//         where: {
//           id: employee.resourcesTo,
//         },
//       });

//   let payrollInfo = {
//     name: employee.name,
//     adharCode: employee.adharCode,
//     month: salary.monthOfSalary,
//     basicPay: salary.basicPay,
//     otAmount: salary.OtHoursAmount,
//     epfAmount: salary.epfAmount,
//     esicAmount: salary.esicAmount,
//     netPay: Number(parseFloat(salary.netPay)).toFixed(2),
//     bata: salary.betaAmount,
//     ...salary,
//     ...employee,
//     overAllSalary: Number(
//       salary.basicPay +
//         salary.OtHoursAmount +
//         salary.betaAmount +
//         salary.otherAllowance +
//         salary.epfAmount +
//         salary.esicAmount +
//         salary.ptAmount +
//         salary.AbAmount
//     ).toFixed(2),
//     totalDeduction: Number(
//       salary.epfAmount +
//         salary.esicAmount +
//         salary.AbAmount +
//         salary.ptAmount +
//         salary.absentDaysAmount
//     ).toFixed(2),
//   };

//   if (clientCompanyInfo) {
//     clientCompanyInfo.name;
//     payrollInfo = {
//       ...payrollInfo,
//       companyName: clientCompanyInfo.name,
//     };
//   }

//   // Prepare HTML
//   const html = await ejs.renderFile(
//     path.join(__dirname, "../template/payroll.ejs"),
//     payrollInfo
//   );

//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.setContent(html);
//   const pdfBuffer = await page.pdf({ format: "A4" });
//   await browser.close();

//   return pdfBuffer;
// };

const getPayrollService = async (body) => {
  const { search, monthAndYear, clientCompanyId, page, sizes } = body;

  if (clientCompanyId && isValidNumber(clientCompanyId)) {
    const companies = await prisma.clientCompany.findUnique({
      where: {
        id: Number(clientCompanyId),
      },
    });

    if (!companies) {
      throw new AppError("Client company not found", 404);
    }
  }

  const employeeList = await prisma.employee.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { empCode: { contains: search, mode: "insensitive" } },
                { adharCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        clientCompanyId && isValidNumber(clientCompanyId)
          ? {
              clientCompanyId: Number(clientCompanyId),
            }
          : {},
      ],
    },
    include: {
      SalaryDetails: {
        where: {
          month_of_salary: monthAndYear ? monthAndYear : undefined,
        },
      },
    },
    skip: (page - 1) * sizes,
    take: sizes,
  });

  return employeeList;
};

const getSinglePaySlipService = async (query) => {
  const { monthYear } = query;
  let empId = Number(query.empId);

  const employee = await prisma.employee.findUnique({
    where: { id: empId },
    include: {
      salaryDesignModal: true,
    },
  });

  if (!employee) throw new AppError("Employee not found", 404);

  const salary = await prisma.salaryDetails.findFirst({
    where: {
      employee: {
        id: empId,
      },
      month_of_salary: monthYear,
    },
  });
  if (!salary) throw new AppError("Salary record not found", 404);

  const myCompany = await prisma.myCompany.findFirst();

  if (!myCompany) throw new AppError("Company details not found", 404);

  let singlePaySlipData = {
    logo: "https://public-erp.s3.eu-north-1.amazonaws.com/poojayalogo.png",
    payslipNumber: "PRE00" + salary.id,
    company: {
      name: myCompany.name,
      addressLine1: myCompany.address1,
      addressLine2: myCompany.address2,
      web: myCompany.websiteLink,
      email: myCompany.email,
    },
    employee: {
      name: employee.name,
      designation: employee.salaryDesignModal.name,
      workedDays: 0,
      allowanceDays: 0,
      uan: employee.uanNumber,
      esi: employee.esicNumber,
      unitName: employee?.unitName || "N/A",
      otDays: 0,
    },
    earnings: Object.values(salary.salary_modal_with_data).map((item) => ({
      name: capitalizeWords(String(item.key).replace(/_/g, " ")),
      amount: item.value,
    })),
    deductions: [
      // { name: "Provident Fund", amount: 11129 },
      // { name: "Professional Tax", amount: 200 },
      // { name: "ESI", amount: 84 },
      // { name: "Total AB Deduction", amount: 2400 },
      // { name: "Bank Charges", amount: 10 },
      // { name: "Other Deduction", amount: 0 },
      // { name: "Total Deductions", amount: 4029 },
      // { name: "Net Pay", amount: 15173 },
    ],
  };

  const html = await ejs.renderFile(
    path.join(__dirname, "../template/SinglePaySlip.ejs"),
    {
      ...singlePaySlipData,
    }
  );

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  return pdfBuffer;
};

const getBulkPaySlipService = async (query) => {
  const { monthYear } = query;
  const clientCompanyId = Number(query.clientCompanyId);

  // 1. Fetch employees + salary data
  const employees = await prisma.employee.findMany({
    where: {
      clientCompanyId: Number(clientCompanyId),
      SalaryDetails: { some: {} },
    },
    include: {
      SalaryDetails: {
        where: { month_of_salary: monthYear },
      },
      salaryDesignModal: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!employees.length) {
    throw new AppError("No employees found for this company/month", 404);
  }

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const buffers = [];

  const myCompany = await prisma.myCompany.findFirst();

  if (!myCompany) throw new AppError("Company details not found", 404);

  let singlePaySlipData = {
    logo: "https://public-erp.s3.eu-north-1.amazonaws.com/poojayalogo.png",
    company: {
      name: myCompany.name,
      addressLine1: myCompany.address1,
      addressLine2: myCompany.address2,
      web: myCompany.websiteLink,
      email: myCompany.email,
    },
    employee: {},
    earnings: [],
    deductions: [
      // { name: "Provident Fund", amount: 11129 },
      // { name: "Professional Tax", amount: 200 },
      // { name: "ESI", amount: 84 },
      // { name: "Total AB Deduction", amount: 2400 },
      // { name: "Bank Charges", amount: 10 },
      // { name: "Other Deduction", amount: 0 },
      // { name: "Total Deductions", amount: 4029 },
      // { name: "Net Pay", amount: 15173 },
    ],
  };

  for (const emp of employees) {
    const salary = emp.SalaryDetails.map((s) => s).find(
      (s) => s.month_of_salary === monthYear
    );
    if (!salary) continue;

    singlePaySlipData.employee = {
      name: emp.name,
      designation: emp.salaryDesignModal.name,
      workedDays: 0,
      allowanceDays: 0,
      uan: emp.uanNumber,
      esi: emp.esicNumber,
      unitName: emp?.unitName || "N/A",
      otDays: 0,
    };

    singlePaySlipData.earnings = Object.values(
      salary.salary_modal_with_data
    ).map((item) => ({
      name: capitalizeWords(String(item.key).replace(/_/g, " ")),
      amount: item.value,
    }));

    singlePaySlipData.payslipNumber = "PRE00" + salary.id;

    const html = await ejs.renderFile(
      path.join(__dirname, "../template/BulkPaySlip.ejs"),
      {
        ...singlePaySlipData,
      }
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await page.close();

    buffers.push(pdfBuffer);
  }

  await browser.close();

  // 3. Merge with pdf-lib
  const mergedPdf = await PDFDocument.create();

  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((p) => mergedPdf.addPage(p));
  }

  const mergedBuffer = await mergedPdf.save();
  return mergedBuffer; // <-- Send this as download response
};

module.exports = {
  uploadEmployeeReportService,
  getDemoXlModalSheetService,
  // getPayrollService,
  uploadPayrollModalService,
  getBulkPaySlipService,
  getSinglePaySlipService,
};
