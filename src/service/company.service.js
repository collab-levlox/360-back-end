const { not } = require("joi");
const prisma = require("../../prisma");
const AppError = require("../utils/AppError");

const companyListingService = async ({
  search = "",
  sort = "asc",
  page = 1,
  size = 10,
}) => {
  page = Number(page);
  size = Number(size);

  const result = await prisma.clientCompany.findMany({
    where: {
      mainBranchId: null,
    },
    include: {
      subBranches: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (search) {
    const s = search.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(s) ||
        item.subBranches.find((i) => i.name.toLowerCase().includes(s)) ||
        item.contactNumber.toLowerCase().includes(s)
    );
  }

  if (sort === "asc") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "desc") {
    result.sort((a, b) => b.name.localeCompare(a.name));
  }

  const total = result.length;
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size;
  const data = result.slice(start, start + size);

  return { total, page, size, totalPages, data };
};

const listMainCompanyService = async (id) => {
  const whereClause = {
    mainBranch: null,
    isDelete: false,
  };

  if (id) {
    whereClause.id = { not: Number(id) };
  }

  const result = await prisma.clientCompany.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "asc",
    },
  });

  return result;
};

const constFormatHandleBeforeCreateOrUpdateCompany = async (data) => {
  if (data.mainBranchId) {
    const unknownCompany = await prisma.clientCompany.findFirst({
      where: {
        id: data.mainBranchId,
      },
    });

    if (!unknownCompany) {
      throw new AppError("Main branch company getting unknown", 409);
    }
  }

  return true;
};

const createClientCompany = async (data) => {
  const existing = await prisma.clientCompany.findFirst({
    where: {
      OR: [{ email: data.email }, { gstinNumber: data.gstinNumber }],
    },
  });

  if (existing) {
    throw new AppError(
      "Company with this email or gstin number is already exists",
      409
    );
  }
  const beforeHandle = await constFormatHandleBeforeCreateOrUpdateCompany(data);

  if (beforeHandle) {
    const company = await prisma.clientCompany.create({
      data: data,
    });
    return company;
  } else {
    throw new AppError("Something went wrong", 500);
  }
};

const updateClientCompany = async (data) => {
  if (data.id === data?.mainBranchId) {
    throw new AppError("Main branch cannot be same as sub branch", 409);
  }

  const beforeHandle = await constFormatHandleBeforeCreateOrUpdateCompany(data);

  if (beforeHandle) {
    const company = await prisma.clientCompany.update({
      where: { id: data.id },
      data: data,
    });
    return company;
  } else {
    throw new AppError("Something went wrong", 500);
  }
};
const companyEmployeeAssignService = async (data) => {
  const { unSelectedEmployeeId, selectedEmployeeId, clientCompanyId } = data;

  if (
    unSelectedEmployeeId &&
    unSelectedEmployeeId.length == 0 &&
    selectedEmployeeId &&
    selectedEmployeeId.length == 0
  ) {
    throw new AppError(
      "Please provide at least one employeeId to assign or unassign",
      400
    );
  }

  const isOverlap = selectedEmployeeId.some((id) =>
    unSelectedEmployeeId.includes(id)
  );

  if (isOverlap) {
    throw new AppError(
      `selectedEmployeeId and unSelectedEmployeeId cannot overlap id with each other`,
      400
    );
  }

  const totalIds = [...selectedEmployeeId, ...unSelectedEmployeeId];

  const employees = await prisma.employee.findMany({
    where: {
      id: {
        in: totalIds,
      },
    },
  });

  if (employees.length !== totalIds.length) {
    const foundIds = employees.map((emp) => emp.id);
    const missingIds = totalIds.filter(
      (id) => !foundIds.includes(id)
    );
    console.log(missingIds,'missingIds');
    
    throw new AppError(
      `Employees with IDs ${missingIds.join(",")} not found`,
      404
    );
  }

  const unknownCompany = await prisma.clientCompany.findUnique({
    where: { id: clientCompanyId },
  });

  if (!unknownCompany) {
    throw new AppError("Company with the given ID not found", 409);
  }

  const selectUpdated = await prisma.employee.updateMany({
    where: {
      id: {
        in: selectedEmployeeId,
      },
    },
    data: {
      clientCompanyId,
    },
  });

  const unselectUpdated = await prisma.employee.updateMany({
    where: {
      id: {
        in: unSelectedEmployeeId,
      },
    },
    data: {
      clientCompanyId: null,
    },
  });

  return {
    selectUpdatedCount: selectUpdated.count,
    unselectedCount: unselectUpdated.count,
  };
};

module.exports = {
  companyListingService,
  createClientCompany,
  listMainCompanyService,
  updateClientCompany,
  companyEmployeeAssignService,
};
