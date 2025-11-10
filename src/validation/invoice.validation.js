const Joi = require("joi");

const getInvoiceDetailsValidation = Joi.object({
  clientCompanyId: Joi.number().integer().optional(),
  monthYear: Joi.string().required(),
});

module.exports = { getInvoiceDetailsValidation };
