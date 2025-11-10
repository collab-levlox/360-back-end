const AppError = require("../utils/AppError");

const CustomValidate = ({
  schemaObj = {},
  res = () => {},
  validateObj = {},
}) => {
  const { error, value } = schemaObj.validate(validateObj, {
    abortEarly: false,
  });

  if (res) {
    if (error) {
      return res.status(400).json({
        message: error.details[0].message.replace(/"/g, ""),
        errors: error.details.map((d) => d.message.replace(/"/g, "")),
      });
    }
  } else {
    if (error) {
      throw new AppError(error.details[0].message.replace(/"/g, ""), 400);
    }
  }

  return value;
};

module.exports = CustomValidate;
