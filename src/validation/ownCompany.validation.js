const Joi = require("joi");

const companyBaseSchema = {
  name: Joi.string().trim().required(),
  address1: Joi.string().trim().required(),
  address2: Joi.string().trim().required(),
  logoUrl: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().required(),
  gstinNumber: Joi.string().trim().required(),
  sacNumber: Joi.string().trim().required(),
  panNumber: Joi.string().trim().required(),
  esicNumber: Joi.string().trim().required(),
  epfNumber: Joi.string().trim().required(),
  serviceTaxNumber: Joi.string().trim().required(),
  websiteLink: Joi.string().trim().required(),
};

const bankDetailsSchema = Joi.object({
  name: Joi.string().trim().required(),
  bankName: Joi.string().trim().required(),
  bankAccount: Joi.string().trim().required(),
  ifsc: Joi.string().trim().required(),
  companyId: Joi.number().integer().required(),
});

const createOwnCompanyValidation = Joi.object({
  ...companyBaseSchema,
  bankDetails: Joi.array().items(bankDetailsSchema).min(1).required(),
});

const updateBankDetailsSchema = Joi.object({
  id:Joi.number().integer().required(),
  name: Joi.string().trim().required(),
  bankName: Joi.string().trim().required(),
  bankAccount: Joi.string().trim().required(),
  ifsc: Joi.string().trim().required(),
  companyId: Joi.number().integer().required(),
});

const updateOwnCompanyValidation = Joi.object({
  id: Joi.number().integer().required(),
  ...companyBaseSchema,
  bankDetails: {
    createBanks: Joi.array().items(bankDetailsSchema).optional(),
    updateBanks: Joi.array().items(updateBankDetailsSchema).optional(),
    deleteBanks: Joi.array().items(Joi.number().integer()).optional(),
  },
  // bankDetails: Joi.array().items(updateBankDetailsSchema).min(1).required(),
});

const ownCompanyDataGet = Joi.object({
  userId: Joi.number().integer().required(),
});

module.exports = {
  createOwnCompanyValidation,
  updateOwnCompanyValidation,
  ownCompanyDataGet,
};
