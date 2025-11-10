const prisma = require("../../prisma");
const AppError = require("../utils/AppError");

const ownCompanyListingService = async ({ userId }) => {
  // console.log(userId,'userId');

  // const user = await prisma.user.findUnique({
  //   where: {
  //     id: parseInt(userId),
  //   },
  // });

  // if (!user) {
  //   throw new AppError("User not found", 404);
  // }

  const result = prisma.myCompany.findMany({
    include: {
      MyCompanyBankDetails: true,
    },
  });

  if (!result) {
    throw new AppError("Company not found", 404);
  }

  return result;
};

const ownCreateClientCompany = async (temp) => {
  let data = { ...temp };
  const bankDetails = data.bankDetails || [];
  delete data.bankDetails;

  const existing = await prisma.myCompany.findFirst({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError("Company with this email already exists", 409);
  }

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.myCompany.create({
      data,
    });

    if (bankDetails.length > 0) {
      await tx.myCompanyBankDetails.createMany({
        data: bankDetails.map((bank) => ({
          ...bank,
          companyId: company.id,
        })),
      });
    }

    return {
      company,
      bankDetails,
    };
  });

  return result;
};

const ownUpdateClientCompany = async (data) => {
  const { id, bankDetails = {}, ...companyData } = data;

  const ownCompanyIsThere = await prisma.myCompany.findUnique({
    where: { id },
  });

  if (!ownCompanyIsThere) {
    throw new AppError("Company not found", 404);
  }
  const banks = await prisma.myCompanyBankDetails.findMany({});
  let deleteBankDetails, createBankDetails, updateBankDetails;

  try {
    if (Object.values(bankDetails).find((i) => i)) {
      const {
        createBanks = [],
        updateBanks = [],
        deleteBanks = [],
      } = bankDetails;

      console.log(banks, "baks");
      console.log();

      if (deleteBanks.length != 0) {
        const notFound = deleteBanks.find(
          (delId) => !banks.find((bank) => bank.id === delId)
        );

        if (notFound) {
          throw new AppError("Delete bank details not found", 404);
        }

        const employeeBindWithThisBank = await prisma.employee.findMany({
          where: {
            companyBankId: {
              in: deleteBanks,
            },
          },
        });
        if (employeeBindWithThisBank && employeeBindWithThisBank.length != 0) {
          throw new AppError("this bank is connect with employee", 404);
        }
        deleteBankDetails = await prisma.myCompanyBankDetails.deleteMany({
          where: {
            id: {
              in: deleteBanks,
            },
          },
        });
      }

      if (updateBanks.length != 0) {
        if (!updateBanks.find((u) => banks.some((b) => b.id === u.id))) {
          throw new AppError("update Bank details not found", 404);
        }
        updateBankDetails = await prisma.$transaction(
          updateBanks.map((bank) =>
            prisma.myCompanyBankDetails.update({
              where: { id: bank.id },
              data: bank,
            })
          )
        );
      }

      if (createBanks.length != 0) {
        createBankDetails = await prisma.myCompanyBankDetails.createMany({
          data: createBanks,
        });
      }
    }
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError(`${err.meta.target[0]} must be unique`, 409);
    } else {
      throw new AppError(err, 500);
    }
  }

  // Update company + banks
  const company = await prisma.myCompany.update({
    where: { id },
    data: {
      ...companyData,
      // ...(bankDetails && {
      //   MyCompanyBankDetails: {
      //     deleteMany: {},
      //     create: bankDetails,
      //   },
      // }),
    },
    // include: { MyCompanyBankDetails: true },
  });

  return {
    company,
    deleteBankDetails,
    createBankDetails,
    updateBankDetails,
  };
};

module.exports = {
  ownCompanyListingService,
  ownCreateClientCompany,
  ownUpdateClientCompany,
};
