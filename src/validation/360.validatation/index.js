const Joi = require("joi");

const getDateBasedConfigValidation = Joi.object({
    date: Joi.date().required(),
    courtType: Joi.string().required(),
})

module.exports = {
    getDateBasedConfigValidation
}