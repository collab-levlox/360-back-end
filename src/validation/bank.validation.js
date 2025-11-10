const Joi = require("joi");

const getBankDetailsValidation = Joi.object({
  bankId: Joi.number().integer().required(),
  monthYear: Joi.string().required(),
});

const getBankReportDemoValidation = Joi.object({
  amountKey: Joi.string().required(),
  bankId: Joi.number().integer().required(),
  monthYear: Joi.string().required(),
});

module.exports = {
  getBankDetailsValidation,
  getBankReportDemoValidation
};
