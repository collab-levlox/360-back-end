const Joi = require("joi");

const listingValidator = Joi.object({
  page: Joi.number().integer().min(1).required(),
  size: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("asc", "desc").optional(),
  search: Joi.string().optional(),
  filter: Joi.string().optional(),
});

module.exports = { listingValidator };
