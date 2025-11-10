const Joi = require("joi");

const invalidMessage = (field) =>
  Joi.string()
    .trim()
    .required()
    .disallow(null)
    .messages({
      "any.required": `${field} is required`,
      "string.empty": `${field} is required`,
      "any.invalid": `${field} is required`,
      "string.base": `${field} is required`,
    });

const employeeListingValidation = Joi.object({
  page: Joi.number().integer().min(1).required(),
  size: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("asc", "desc").optional(),
  search: Joi.string().optional(),
  employeeInBenchAndClientCompany:Joi.number().optional()
});

const genderEnum = ["MALE", "FEMALE", "OTHERS"];
const employeeStatusEnum = ["ACTIVE", "INACTIVE", "TERMINATED"];

const employeeCreateValidation = Joi.object({
  name: Joi.string().trim().required(),
  empCode: Joi.string().trim().required(),
  adharNumber: Joi.string()
    .trim()
    .pattern(/^\d{12}$/)
    .message("adhar number must be 12 digits")
    .required(),
  uanNumber: Joi.string().trim().optional().allow(null, ""),
  bankAccount: Joi.string().trim().optional().allow(null, ""),
  ifscCode: Joi.string().trim().optional().allow(null, ""),
  gender: Joi.string()
    .valid(...genderEnum)
    .required(),
  epfNumber: Joi.string().trim().optional().allow(null, ""),
  esicNumber: Joi.string().trim().optional().allow(null, ""),
  mobileNumber: Joi.string().trim().required(),
  SecondaryMobile: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  city: Joi.string().trim().required().messages({
    "any.required": "City is required",
    "string.empty": "City is required",
    "any.invalid": "City is required",
    "string.base": "City is required",
  }),
  pinCode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  email: Joi.string().trim().email().optional().allow(null, ""),
  bloodGroup: Joi.string().trim().optional().allow(null, ""),
  employeeStatus: Joi.string()
    .valid(...employeeStatusEnum)
    .optional(),
  clientCompanyId: Joi.number().integer().optional().allow(null),
  companyBankId: Joi.number().integer().required().messages({
 "any.required": "company bank id is required",
  "number.base": "company bank id is required",
  "any.invalid": "company bank id is required"
}),
  salaryDesignModalId: Joi.number().optional().allow(null),
});

const employeeUpdateValidation = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().trim().required(),
  empCode: Joi.string().trim().required(),
  adharNumber: Joi.string()
    .trim()
    .pattern(/^\d{12}$/)
    .message("adhar number must be 12 digits")
    .required(),
  uanNumber: Joi.string().trim().optional().allow(null, ""),
  bankAccount: Joi.string().trim().optional().allow(null, ""),
  ifscCode: Joi.string().trim().optional().allow(null, ""),
  gender: Joi.string()
    .valid(...genderEnum)
    .optional(),
  epfNumber: Joi.string().trim().optional().allow(null, ""),
  esicNumber: Joi.string().trim().optional().allow(null, ""),
  mobileNumber: Joi.string().trim().required(),
  SecondaryMobile: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  city: Joi.string().trim().required(),
  pinCode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .message("pin code must be 6 digits")
    .required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  email: Joi.string().trim().email().optional().allow(null, ""),
  bloodGroup: Joi.string().trim().optional().allow(null, ""),
  employeeStatus: Joi.string()
    .valid(...employeeStatusEnum)
    .optional(),
  clientCompanyId: Joi.number().integer().optional().allow(null),
  companyBankId: Joi.number().integer().required(),
  salaryDesignModalId: Joi.number().optional().allow(null),
});

module.exports = {
  employeeListingValidation,
  employeeCreateValidation,
  employeeUpdateValidation,
};
