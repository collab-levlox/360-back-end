const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  mobile:Joi.string().max(12).required(),
  role:Joi.string().valid("ADMIN", "USER").optional(),

});

module.exports = {
  authValidator: {
    login: loginSchema,
    register: registerSchema,
  },
};
