const prisma = require("../../prisma");
const { Gender, employeeStatus } = require("@prisma/client");
const AppError = require("../utils/AppError");
const ExcelJS = require("exceljs");
const {
  employeeCreateValidation,
} = require("../validation/employee.validation");
const validate = require("../validation");
const { customValidation } = require("../validation/customValidate");
const { isValidNumber } = require("../utils/utility");

const employeeListingService = async ({
  search = "",
  sort = "desc",
  page = 1,
  size = 10,
  employeeInBenchAndClientCompany = null,
}) => {
  page = Number(page);
  size = Number(size);

  let whereClause = {};

  if (search) {
    whereClause = {
      name: {
        contains: search,
        mode: "insensitive",
      },
      empCode: {
        contains: search,
        mode: "insensitive",
      },
      uanNumber: {
        contains: search,
        mode: "insensitive",
      },
      mobileNumber: {
        contains: search,
        mode: "insensitive",
      },
      adharNumber: {
        contains: search,
        mode: "insensitive",
      },
    };
  }

  let optionalWhereForBenchAndClientEmployee = {};
  if (
    employeeInBenchAndClientCompany &&
    isValidNumber(employeeInBenchAndClientCompany)
  ) {
    const company = await prisma.clientCompany.findUnique({
      where: {
        id: parseInt(employeeInBenchAndClientCompany),
      },
    });

    if (!company) {
      throw new AppError("Selected Company is not found", 404);
    }

    optionalWhereForBenchAndClientEmployee = {
      OR: [
        { clientCompanyId: null },
        { clientCompanyId: parseInt(employeeInBenchAndClientCompany) },
      ],
    };
  }

  let result = await prisma.employee.findMany({
    where: {
      ...whereClause,
      ...optionalWhereForBenchAndClientEmployee,
    },
    orderBy: {
      updatedAt: sort,
    },
    skip: (page - 1) * size,
    take: size,
  });

  const total = result.length;
  const totalPages = Math.ceil(total / size);

  return { total, page, size, totalPages, data: result };
};

const constFormatHandleBeforeCreateOrUpdate = async (req) => {
  try {
    if (req?.clientCompanyId) {
      const company = await prisma.clientCompany.findUnique({
        where: {
          id: req?.clientCompanyId,
        },
      });
      if (!company) {
        throw new AppError("Selected Company is not found", 404);
      }
    }

    if (req?.companyBankId) {
      const bankDetails = await prisma.myCompanyBankDetails.findUnique({
        where: {
          id: req.companyBankId,
        },
      });

      if (!bankDetails) {
        throw new AppError("Selected Company bank id is not found", 404);
      }
    }
    return true;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("something went wrong", 500);
  }
};

const genderValidation = (gender) => {
  if (gender === Gender.MALE) {
    return Gender.MALE;
  } else if (gender === Gender.FEMALE) {
    return Gender.FEMALE;
  } else if (gender === Gender.OTHERS) {
    return Gender.OTHERS;
  } else {
    return false;
  }
};

const createEmployee = async (req) => {
  if (req?.empCode || req?.uanNumber || req?.adharNumber) {
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { empCode: req?.empCode },
          { adharNumber: req?.adharNumber },
          { uanNumber: req?.uanNumber },
        ],
      },
    });

    if (existing) {
      throw new AppError(
        "Employee with this Emp Code or UAN number or or already exists",
        409
      );
    }
  }

  const genderValidationT = genderValidation(String(req?.gender).toUpperCase());

  if (!genderValidationT) {
    throw new AppError("gender is not matched with DB", 409);
  } else {
    req.gender = genderValidationT;
  }
  const beforeHandle = await constFormatHandleBeforeCreateOrUpdate(req);

  if (beforeHandle) {
    const employee = await prisma.employee.create({
      data: req,
    });
    return employee;
  } else {
    throw new AppError("Something went wrong", 500);
  }
};

const updateEmployee = async (req) => {
  const beforeHandle = await constFormatHandleBeforeCreateOrUpdate(req);

  if (beforeHandle) {
    const employee = await prisma.employee.update({
      where: { id: req.id },
      data: req,
    });
    return employee;
  } else {
    throw new AppError("Something went wrong", 500);
  }
};

async function bulkEmployeeUploadService(file, res) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer); // `file.buffer` from multer
  const ws = workbook.getWorksheet("Employees");

  // ✅ Expected headers (must match what we exported earlier)
  const employeeExcelMapping = [
    { key: "name", excelHeadName: "Employee Name" },
    { key: "empCode", excelHeadName: "Employee Code" },
    { key: "adharNumber", excelHeadName: "Aadhar Number" },
    { key: "uanNumber", excelHeadName: "UAN Number" },
    { key: "bankAccount", excelHeadName: "Bank Account" },
    { key: "ifscCode", excelHeadName: "IFSC Code" },
    { key: "gender", excelHeadName: "Gender" },
    { key: "epfNumber", excelHeadName: "EPF Number" },
    { key: "esicNumber", excelHeadName: "ESIC Number" },
    { key: "mobileNumber", excelHeadName: "Mobile Number" },
    { key: "SecondaryMobile", excelHeadName: "Secondary Mobile" },
    { key: "address", excelHeadName: "Address" },
    { key: "city", excelHeadName: "City" },
    { key: "pinCode", excelHeadName: "PIN Code" },
    { key: "state", excelHeadName: "State" },
    { key: "country", excelHeadName: "Country" },
    { key: "email", excelHeadName: "Email Address" },
    { key: "bloodGroup", excelHeadName: "Blood Group" },
    { key: "companyBankId", excelHeadName: "Company Bank", type: "number" },
    { key: "clientCompanyId", excelHeadName: "Client Company", type: "number" },
    {
      key: "salaryDesignModalId",
      excelHeadName: "Salary Design Modal",
      type: "number",
    },
  ];

  const expectedHeaders = employeeExcelMapping.map((m) => m.excelHeadName);
  const headerRow = ws.getRow(1).values.slice(1); // ExcelJS 1-indexed, skip index 0

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headerRow[i] !== expectedHeaders[i]) {
      throw new Error(
        `Invalid header at column ${i + 1}. Expected "${
          expectedHeaders[i]
        }", got "${headerRow[i]}"`
      );
    }
  }

  let errors = [];
  let uploadCount = 0;

  // ✅ Step 2: Preload reference tables
  const [banks, companies, salaryModals] = await Promise.all([
    prisma.myCompanyBankDetails.findMany({ select: { id: true } }),
    prisma.clientCompany.findMany({ select: { id: true } }),
    prisma.salaryDesignModal.findMany({ select: { id: true } }),
  ]);
  const bankIds = banks.map((b) => b.id);
  const companyIds = companies.map((c) => c.id);
  const salaryIds = salaryModals.map((s) => s.id);

  console.log(
    { bankIds, companyIds, salaryIds },
    "bankIds,companyIds,salaryIds"
  );

  let rowDataArr = [];
  ws.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
    if (rowNumber === 1 || errors.length != 0) return;

    const rowData = {};

    // employeeExcelMapping.forEach((m, i) => {
    //   rowData[m.key] = row.getCell(i + 1).value
    //     ? String(row.getCell(i + 1).value).trim()
    //     : null;
    // });

    employeeExcelMapping.forEach((m, i) => {
      let cellValue = row.getCell(i + 1).value;

      if (cellValue && typeof cellValue === "object") {
        if (cellValue.text) {
          cellValue = cellValue.text;
        } else {
          cellValue = String(cellValue);
        }
      }

      rowData[m.key] = cellValue
        ? String(cellValue).trim()
        : m.type == "number"
        ? null
        : "";
    });

    if (rowData.companyBankId) {
      let id = parseInt(rowData.companyBankId.split("-")[0]);
      if (!bankIds.includes(id)) {
        throw new AppError(`Row ${rowNumber}: Invalid Company Bank ID`);
      }
      rowData.companyBankId = id;
    }

    if (rowData.salaryDesignModalId) {
      rowData.salaryDesignModalId = parseInt(
        rowData.salaryDesignModalId.split("-")[0]
      );
      if (!salaryIds.includes(rowData.salaryDesignModalId)) {
        errors.push({
          rowNumber,
          details: [
            { message: "invalid company bind with salary design modal" },
          ],
        });
        return;
      }
    }

    if (rowData.clientCompanyId) {
      rowData.clientCompanyId = parseInt(rowData.clientCompanyId.split("-")[0]);
      if (!salaryIds.includes(rowData.clientCompanyId)) {
        errors.push({
          rowNumber,
          details: [{ message: "invalid company selected" }],
        });
        return;
      }
    }

    console.log(rowData, "dara");

    const { error, value } = customValidation(
      employeeCreateValidation,
      rowData
    );

    if (error) {
      errors.push({ ...error, rowNumber });
      return;
    }

    // if (rowData.salaryDesignModalId) {
    //   rowData.salaryDesignModal = {
    //     connect: { id: rowData['salaryDesignModalId'] },
    //   };
    // } else {
    //   rowData.salaryDesignModal = null;
    // }
    // delete rowData.salaryDesignModalId;

    // if (rowData.clientCompanyId) {
    //   rowData.clientCompany = { connect: { id: rowData['clientCompanyId'] } };
    // } else {
    //   rowData.clientCompany = null;
    // }
    // delete rowData.clientCompanyId;

    // customValidation(
    //   employeeCreateValidation,
    //   rowData,
    //   // () => {},
    //   // (e) => {
    //   //  throw new AppError(`Row ${rowNumber}: ${e}`);
    //   // }
    // );

    rowDataArr.push(rowData);
  });

  if (errors.length != 0) {
    let e = errors[0];
    throw new AppError(
      `Row ${e.rowNumber}: ${e?.details[0]?.message.replace(/"/g, "")}`,
      409
    );
  }

  const empCodes = rowDataArr.map((r) => r.empCode);

  const existingEmployees = await prisma.employee.findMany({
    where: { empCode: { in: empCodes } },
    select: { empCode: true },
  });

  const existingSet = new Set(existingEmployees.map((e) => e.empCode));

  let createdCount = 0;
  let updatedCount = 0;

  const result = await Promise.all(
    rowDataArr.map((rowData) => {
      const isUpdate = existingSet.has(rowData.empCode);
      if (isUpdate) updatedCount++;
      else createdCount++;
      return prisma.employee.upsert({
        where: { empCode: rowData.empCode },
        update: { ...rowData },
        create: { ...rowData, employeeStatus: employeeStatus.ACTIVE },
      });
    })
  ).catch((err) => {
    if (err.code === "P2002") {
      throw new AppError(`${err.meta.target[0]} must be unique`, 409);
    } else {
      throw new AppError(err, 500);
    }
  });

  return { data: result, createdCount, updatedCount };
}

async function getDemoModalEmployeeReportService(req) {
  const clientCompanyList = await prisma.clientCompany.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const salaryDesignModalList = await prisma.salaryDesignModal.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const companyBankList = await prisma.myCompanyBankDetails.findMany({
    select: {
      id: true,
      bankName: true,
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Employees");

  const employeeExcelMapping = [
    // { key: "id", excelHeadName: "Employee ID" },
    { key: "name", excelHeadName: "Employee Name" },
    { key: "empCode", excelHeadName: "Employee Code" },
    { key: "adharNumber", excelHeadName: "Aadhar Number" },
    { key: "uanNumber", excelHeadName: "UAN Number" },
    { key: "bankAccount", excelHeadName: "Bank Account" },
    { key: "ifscCode", excelHeadName: "IFSC Code" },
    { key: "gender", excelHeadName: "Gender" },
    { key: "epfNumber", excelHeadName: "EPF Number" },
    { key: "esicNumber", excelHeadName: "ESIC Number" },
    { key: "mobileNumber", excelHeadName: "Mobile Number" },
    { key: "SecondaryMobile", excelHeadName: "Secondary Mobile" },
    { key: "address", excelHeadName: "Address" },
    { key: "city", excelHeadName: "City" },
    { key: "pinCode", excelHeadName: "PIN Code" },
    { key: "state", excelHeadName: "State" },
    { key: "country", excelHeadName: "Country" },
    { key: "email", excelHeadName: "Email Address" },
    { key: "bloodGroup", excelHeadName: "Blood Group" },
    // employeeStatus skipped (default ACTIVE)
    { key: "companyBankId", excelHeadName: "Company Bank" },
    { key: "clientCompanyId", excelHeadName: "Client Company" },
    { key: "salaryDesignModalId", excelHeadName: "Salary Design Modal" },
  ];

  // Add header row
  ws.addRow(employeeExcelMapping.map((m) => m.excelHeadName));

  // Freeze header
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Dropdown values
  const bankOptions = companyBankList
    .map((c) => `${c.id}-${c.bankName}`)
    .join(",");
  const salaryOptions = salaryDesignModalList
    .map((s) => `${s.id}-${s.name}`)
    .join(",");
  const clientOptions = clientCompanyList
    .map((c) => `${c.id}-${c.name}`)
    .join(",");
  const gender = ["MALE", "FEMALE", "OTHERS"].map((i) => `${i}`).join(",");

  const bankCol =
    employeeExcelMapping.findIndex((m) => m.key === "companyBankId") + 1;
  const salaryCol =
    employeeExcelMapping.findIndex((m) => m.key === "salaryDesignModalId") + 1;
  const clientCol =
    employeeExcelMapping.findIndex((m) => m.key === "clientCompanyId") + 1;
  const genderCol =
    employeeExcelMapping.findIndex((m) => m.key === "gender") + 1;

  // Apply dropdowns only for first 5 rows
  for (let row = 2; row <= 6; row++) {
    ws.getCell(row, bankCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${bankOptions}"`],
    };
    ws.getCell(row, salaryCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${salaryOptions}"`],
    };
    ws.getCell(row, clientCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${clientOptions}"`],
    };
    ws.getCell(row, genderCol).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${gender}"`],
    };
  }

  // Style header (optional, makes freeze more visible)
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEEEEE" },
  };

  const uint8Array = await wb.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
}

module.exports = {
  employeeListingService,
  createEmployee,
  updateEmployee,
  bulkEmployeeUploadService,
  getDemoModalEmployeeReportService,
};
