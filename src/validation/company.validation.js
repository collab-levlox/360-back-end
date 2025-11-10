const Joi = require("joi");

const companyListingValidation = Joi.object({
  page: Joi.number().integer().min(1).required(),
  size: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("asc", "desc").optional(),
  search: Joi.string().optional(),
});

const companyCreateValidation = Joi.object({
  name: Joi.string().trim().required(),
  address1: Joi.string().trim().required(),
  address2: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  stateCode: Joi.string().trim().required(),
  gstinNumber: Joi.string().trim().optional().allow(null, ""),
  contactNumber: Joi.string().trim().required(),
  secondaryContact: Joi.string().trim().optional().allow(null, ""),
  contactPersonName: Joi.string().trim().optional().allow(null, ""),
  contactPersonDesignation: Joi.string().trim().optional().allow(null, ""),
  email: Joi.string().trim().email().optional().allow(null, ""),
  mainBranchId: Joi.number().integer().optional().allow(null),
});

const companyUpdateValidation = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().trim().required(),
  address1: Joi.string().trim().required(),
  address2: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  stateCode: Joi.string().trim().required(),
  gstinNumber: Joi.string().trim().optional().allow(null, ""),
  contactNumber: Joi.string().trim().required(),
  secondaryContact: Joi.string().trim().optional().allow(null, ""),
  contactPersonName: Joi.string().trim().optional().allow(null, ""),
  contactPersonDesignation: Joi.string().trim().optional().allow(null, ""),
  email: Joi.string().trim().email().optional().allow(null, ""),
  mainBranchId: Joi.number().integer().optional().allow(null),
});

const companyAssignValidation = Joi.object({
  selectedEmployeeId: Joi.array()
    .items(Joi.number().integer().messages({
      'number.base': 'Each employeeId must be a number'
    }))
    .messages({
      'array.base': 'employeeId should be an array',
    }),
  
  unSelectedEmployeeId: Joi.array()
    .items(Joi.number().integer().messages({
      'number.base': 'Each employeeId must be a number'
    }))
    .messages({
      'array.base': 'employeeId should be an array',
    }),
  
  clientCompanyId: Joi.number()
    .required()
    .messages({
      'number.base': 'clientCompanyId must be a number',
      'any.required': 'clientCompanyId is required'
    })
});


module.exports = {
  companyListingValidation,
  companyCreateValidation,
  companyUpdateValidation,
  companyAssignValidation
};
