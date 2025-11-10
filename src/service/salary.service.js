const prisma = require("../../prisma");
const xlsx = require("xlsx");
const {
  modalFormatCheck,
  updateFormulaFieldWithAmount,
  isValidNumber,
} = require("../utils/utility");
const AppError = require("../utils/AppError");
const ExcelJs = require("exceljs");

function sanitizeSheetName(name, fallback = "Sheet") {
  // Replace invalid characters with "_"
  let clean = name.replace(/[:\\/?*\[\]]/g, "_");

  // Trim to 31 chars max
  clean = clean.substring(0, 31);

  // Prevent empty sheet name
  if (!clean.trim()) {
    clean = fallback;
  }

  return clean;
}

const getSalaryDesignAddDemoXlModalSheetService = async ({
  clientCompanyId,
}) => {
  const company = await prisma.clientCompany.findUnique({
    where: {
      id: parseInt(clientCompanyId),
    },
    include: {
      salaryDesignModal: true,
    },
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const employeeList = await prisma.employee.findMany({
    where: {
      clientCompanyId: parseInt(clientCompanyId),
      salaryDataStatus: "PENDING",
      salaryDesignModal: {
        isNot:null
      },
    },
    select: {
      empCode: true,
      name: true,
      salaryDesignModal: true,
    },
  });

  const { salaryDesignModal } = company;

  const wb = new ExcelJs.Workbook();

  const allDesignModalHeader = salaryDesignModal.map((i) => {
    let eachHeader = [{ key: "employee code" }, { key: "employee name" }];

    Object.values(i.design_modal).forEach((field) => {
      if (field.type === "input") {
        eachHeader.push(field);
      }
    });

    return { data: eachHeader, salaryDesignModalId: i.id, modalName: i.name };
  });

  // ✅ Now separate worksheet for each modal
  allDesignModalHeader.forEach((modal) => {
    const ws = wb.addWorksheet(
      sanitizeSheetName(modal.modalName || "SalaryDesign")
    );

    ws.views = [{ state: "frozen", ySplit: 1 }];

    const headerRow = ws.addRow(modal.data.map((d) => d.key));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };

    const empList = employeeList.filter(
      (emp) => emp.salaryDesignModal.id === modal.salaryDesignModalId
    );

    empList.forEach((emp) => {
      ws.addRow([emp.empCode, emp.name]);
    });
  });

  const uint8Array = await wb.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
};
const getAttendanceDesignAddDemoXlModalSheetService = async ({
  clientCompanyId,
}) => {
  const company = await prisma.clientCompany.findUnique({
    where: {
      id: Number(clientCompanyId),
    },
    include: {
      salaryDesignModal: {
        where: {
          attendanceDesignModal: {
            some: {},
          },
        },
        include: {
          attendanceDesignModal: true,
        },
      },
    },
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const employeeList = await prisma.employee.findMany({
    where: {
      clientCompanyId: Number(clientCompanyId),
      salaryDataStatus: "SALARY_MODAL_ADDED",
      // // salaryDesignModal: {  some: {},
      // },
    },
    select: {
      empCode: true,
      name: true,
      salaryDesignModal: true,
    },
  });

  const { salaryDesignModal } = company;

  const wb = new ExcelJs.Workbook();

  const allDesignModalHeader = salaryDesignModal.map((i) => {
    let eachHeader = [{ key: "employee code" }, { key: "employee name" }];

    Object.values(i.attendanceDesignModal[0].design_modal).forEach((field) => {
      if (field.type === "input") {
        eachHeader.push(field);
      }
    });

    return { data: eachHeader, salaryDesignModalId: i.id, modalName: i.name };
  });

  // ✅ Now separate worksheet for each modal
  allDesignModalHeader.forEach((modal) => {
    const ws = wb.addWorksheet(
      sanitizeSheetName(modal.modalName || "AttendanceDesign")
    );

    ws.views = [{ state: "frozen", ySplit: 1 }];

    const headerRow = ws.addRow(modal.data.map((d) => d.key));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };

    const empList = employeeList.filter(
      (emp) => emp.salaryDesignModal.id === modal.salaryDesignModalId
    );

    empList.forEach((emp) => {
      ws.addRow([emp.empCode, emp.name]);
    });
  });

  const uint8Array = await wb.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
};

const uploadBasicDataSalaryDesignModalService = async (
  fileBuffer,
  companyId
) => {
  const error = {
    value: "",
    status: false,
  };
  const wb = new ExcelJs.Workbook();
  await wb.xlsx.load(fileBuffer);

  const salaryDesignModalList = await prisma.salaryDesignModal.findMany({
    where: { clientCompanyId: Number(companyId) },
    select: { id: true, name: true, design_modal: true },
  });

  // map sanitized names to ids
  const modalMap = {};
  salaryDesignModalList.forEach((m, idx) => {
    modalMap[sanitizeSheetName(m.name || `Modal_${m.id}`, `Sheet_${idx + 1}`)] =
      m.id;
  });

  const result = [];

  try {
    wb.eachSheet((ws) => {
      const modalId = modalMap[ws.name];
      if (!modalId) return;

      const headerRow = ws.getRow(1).values.slice(1);
      const currentDesignModal = salaryDesignModalList.find(
        (i) => i.id == modalId
      );

      let currentModalKeys = Object.values(currentDesignModal.design_modal)
        .filter((i) => i.type == "input")
        .map((i) => i.key);

      currentModalKeys = [
        "employee code",
        "employee name",
        ...currentModalKeys,
      ];

      if (
        currentModalKeys.length != headerRow.length ||
        !currentModalKeys.every((i) => headerRow.includes(i))
      ) {
        throw new Error(
          `Header row is not matching with the modal keys in ${ws.name} sheet`
        );
      }

      ws.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;

        const rowValues = row.values.slice(1);
        if (!rowValues[0]) return;

        const empCode = rowValues[0];
        const empName = rowValues[1];

        const inputs = {};
        for (let i = 2; i < headerRow.length; i++) {
          if (rowValues[i] && !isValidNumber(rowValues[i])) {
            throw new Error(
              `Invalid value "${rowValues[i]}" in sheet "${
                ws.name
              }" at row ${rowIndex}, column ${i + 1}`
            );
          }
          inputs[headerRow[i]] = rowValues[i] ?? null;
        }

        //  let modal =  currentDesignModal.design_modal.map()
        //         let currentModalKeys = Object.values(
        //  currentDesignModal.design_modal
        // )
        //   .filter((i) => i.type == "input")

        let modal = {};
        Object.keys(currentDesignModal.design_modal).forEach((step) => {
          let val = currentDesignModal.design_modal[step];
          console.log(val, "value");

          if (val.type == "input") {
            modal[step] = {
              ...val,
              value: inputs[val.key],
            };
          } else {
            modal[step] = val;
          }
        });
        console.log(modal, "modal");

        let f = updateFormulaFieldWithAmount({ modal });
        result.push({ inputs: f, empCode });
      });
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  const empCodes = result.map((e) => `'${e.empCode}'`).join(",");

  const cases = result
    .map((e) => `WHEN '${e.empCode}' THEN '${JSON.stringify(e.inputs)}'::jsonb`)
    .join("\n");

  const query = `
  UPDATE "Employee" AS e
  SET 
    "salaryDataStatus" = 'SALARY_MODAL_ADDED',
    "SalaryDesignModalData" = CASE "empCode"
      ${cases}
    END
  WHERE "empCode" IN (${empCodes});
`;

  return await prisma.$executeRawUnsafe(query);
};

const uploadAttendanceDataDesignModalService = async (
  fileBuffer,
  companyId,
  month_of_salary
) => {
  const wb = new ExcelJs.Workbook();
  await wb.xlsx.load(fileBuffer);

  const salaryDesignModalList = await prisma.salaryDesignModal.findMany({
    where: {
      clientCompanyId: Number(companyId),
      attendanceDesignModal: { some: {} },
    },
    select: {
      id: true,
      name: true,
      design_modal: true,
      attendanceDesignModal: true,
    },
  });

  const empList = await prisma.employee.findMany({
    where: {
      clientCompanyId: Number(companyId),
      salaryDataStatus: "SALARY_MODAL_ADDED",
    },
  });

  const modalMap = {};
  salaryDesignModalList.forEach((m, idx) => {
    modalMap[sanitizeSheetName(m.name || `Modal_${m.id}`, `Sheet_${idx + 1}`)] =
      m.id;
  });

  const result = [];

  try {
    wb.eachSheet((ws) => {
      const modalId = modalMap[ws.name];
      if (!modalId) return;

      const headerRow = ws.getRow(1).values.slice(1);
      const currentDesignModal = salaryDesignModalList.find(
        (i) => i.id == modalId
      );

      let currentModalKeys = Object.values(
        currentDesignModal.attendanceDesignModal[0].design_modal
      )
        .filter((i) => i.type == "input")
        .map((i) => i.key);

      currentModalKeys = [
        "employee code",
        "employee name",
        ...currentModalKeys,
      ];

      if (
        currentModalKeys.length != headerRow.length ||
        !currentModalKeys.every((i) => headerRow.includes(i))
      ) {
        throw new Error(
          `Header row is not matching with the modal keys in ${ws.name} sheet`
        );
      }

      ws.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;

        const rowValues = row.values.slice(1);
        if (!rowValues[0]) return;

        const empCode = rowValues[0];
        const empName = rowValues[1];

        const inputs = {};
        for (let i = 2; i < headerRow.length; i++) {
          if (rowValues[i] && !isValidNumber(rowValues[i])) {
            throw new Error(
              `Invalid value "${rowValues[i]}" in sheet "${
                ws.name
              }" at row ${rowIndex}, column ${i + 1}`
            );
          }
          inputs[headerRow[i]] = rowValues[i] ?? null;
        }

        let modal = {};
        Object.keys(
          currentDesignModal.attendanceDesignModal[0].design_modal
        ).forEach((step) => {
          let val =
            currentDesignModal.attendanceDesignModal[0].design_modal[step];

          if (val.type == "input") {
            modal[step] = {
              ...val,
              value: inputs[val.key],
            };
          } else {
            modal[step] = val;
          }
        });

        let empDetails = empList.find((i) => i.empCode == empCode);
        if (!empDetails) {
          throw new Error(
            `Employee with code ${empCode} not found in ${rowIndex + 1} row}`
          );
        }

        let f = updateFormulaFieldWithAmount({
          modal,
          extraModal: empDetails.SalaryDesignModalData,
        });

        result.push({
          inputs: { ...empDetails.SalaryDesignModalData, ...f },
          empCode,
          empId:empDetails.id,
          salaryDesignModalId: currentDesignModal.id,
        });
      });
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  return await prisma.$transaction(
    result.map((r) =>
      prisma.salaryDetails.upsert({
        where: {
          month_of_salary_empId_salaryDesignModalId: {
            empId: r.empId,
            month_of_salary,
            salaryDesignModalId: r.salaryDesignModalId,
          },
        },
        update: {
          salary_modal_with_data: r.inputs,
        },
        create: {
          empId: r.empId,
          month_of_salary,
          salaryDesignModalId: r.salaryDesignModalId,
          salary_modal_with_data: r.inputs,
        },
      })
    )
  );
};

const getSalaryDetailsService = async (req) => {
  const {
    search,
    employeeCode,
    clientCompanyId,
    monthOfSalary,
    employeeId,
    page,
    size,
  } = req;

  const pageT = Number(page) || 1;
  const sizeT = Number(size) || 10;
  const clientCompany =
    clientCompanyId &&
    (await prisma.clientCompany.findUnique({
      where: {
        id: Number(clientCompanyId),
      },
    }));

  if (clientCompanyId && !clientCompany) {
    throw new Error("Client Company Not Found", 400);
  }

  const employeeWhere = employeeCode ? { employeeCode } : {};
  const employeeIdWhere = employeeId ? { id: Number(employeeId) } : {};
  const monthOfSalaryWhere = monthOfSalary
    ? { month_of_salary: monthOfSalary }
    : {};
  const clientCompanyWhere = clientCompanyId
    ? { clientCompanyId: Number(clientCompanyId) }
    : {};
  const searchWhere = search
    ? {
        empCode: {
          contains: search,
          mode: "insensitive",
        },
        name: {
          contains: search,
          mode: "insensitive",
        },
      }
    : {};

  const totalCount = await prisma.employee.count({
    where: {
      ...searchWhere,
      ...employeeWhere,
      ...employeeIdWhere,
      ...clientCompanyWhere,
      SalaryDetails: {
        some: {
          ...monthOfSalaryWhere,
        },
      },
    },
  });

  const result = await prisma.employee.findMany({
    where: {
      ...searchWhere,
      ...employeeWhere,
      ...clientCompanyWhere,
      ...employeeWhere,
      SalaryDetails: {
        some: {
          ...monthOfSalaryWhere,
        },
      },
    },
    include: {
      SalaryDetails: {
        where: {
          ...monthOfSalaryWhere,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    omit: {
      SalaryDesignModalData: true,
    },

    skip: (pageT - 1) * sizeT,
    take: sizeT,
  });

  return {
    data: result,
    totalCount,
    totalPages: Math.ceil(totalCount / sizeT),
  };
};

const createSalaryDesignModalService = async (salaryDesignModal) => {
  const { clientCompanyId, modal, name } = salaryDesignModal;

  const clientCompany = await prisma.clientCompany.findUnique({
    where: {
      id: clientCompanyId,
    },
  });

  if (!clientCompany) {
    throw new Error("Client company not found", 409);
  }

  const result = await prisma.salaryDesignModal.create({
    data: {
      name,
      design_modal: modal,
      clientCompanyId,
    },
  });

  return result;
};

const createAttendanceDesignModalService = async (attendanceDesignModal) => {
  const { salaryDesignModalId, name, modal } = attendanceDesignModal;

  const salaryModal = await prisma.salaryDesignModal.findUnique({
    where: {
      id: salaryDesignModalId,
    },
  });

  if (!salaryModal) {
    throw new Error("Salary design modal not found", 409);
  }

  const result = await prisma.attendanceDesignModal.create({
    data: {
      name,
      design_modal: modal,
      salaryDesignModalId,
    },
  });

  return result;
};

const getSalaryDesignModalListService = async ({
  modal,
  search,
  id,
  clientCompanyId,
}) => {
  let result = null;

  const searchFilter = search
    ? {
        name: {
          contains: search,
          mode: "insensitive",
        },
      }
    : {};

  const idFilter = id ? { id: Number(id) } : {};
  const companyId = clientCompanyId
    ? { clientCompanyId: Number(clientCompanyId) }
    : {};
    const companyIdForAttendance = clientCompanyId
    ? {
        salaryDesignModal: {
          clientCompanyId: Number(clientCompanyId),
        },
      }
    : {};

  if (modal == 1) {
    result = await prisma.salaryDesignModal.findMany({
      where: {
        ...companyId,
        ...searchFilter,
        ...idFilter,
      },
      include: {
        attendanceDesignModal: true,
      },
    });
  } else {
    result = await prisma.attendanceDesignModal.findMany({
      where: {
        ...companyIdForAttendance,
        ...searchFilter,
        ...idFilter,
      },
      include: {
        salaryDesignModal: true,
      },
    });
  }

  return result;
};

const salaryAddedBasedOnDesignModalService = async ({
  modal,
  employeeId,
  salaryDesignModalId,
}) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    throw new AppError("Employee id not found");
  }

  const designModal = await prisma.salaryDesignModal.findUnique({
    where: {
      id: salaryDesignModalId,
    },
  });

  if (!designModal) {
    throw new AppError("Design modal id not found");
  }

  if (salaryDesignModalId != employee.salaryDesignModalId) {
    throw new AppError("Design modal id not match with employee");
  }

  const validate = modalFormatCheck({
    modal: modal,
  });
  if (validate) {
    throw AppError("Invalid modal format", 409);
  }

  const data = await updateFormulaFieldWithAmount({ modal: req });

  const result = await prisma.salaryDataEmployeeModal.create({
    data: {
      SalaryDesignModalData: data,
      salaryDataStatus: "SALARY_MODAL_ADDED",
    },
  });

  return result;
};

const salaryBaseOnDesignModalService = async ({
  modal,
  employeeId,
  salaryDesignModalId,
}) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    throw new AppError("Employee id not found");
  }
};

module.exports = {
  getSalaryDesignAddDemoXlModalSheetService,
  createSalaryDesignModalService,
  createAttendanceDesignModalService,
  getSalaryDesignModalListService,
  salaryAddedBasedOnDesignModalService,
  salaryBaseOnDesignModalService,
  uploadBasicDataSalaryDesignModalService,
  getAttendanceDesignAddDemoXlModalSheetService,
  uploadAttendanceDataDesignModalService,
  getSalaryDetailsService,
};
