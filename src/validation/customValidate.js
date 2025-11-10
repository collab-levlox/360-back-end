const customValidation = (schema, valueT, successCalBack, errorCallback) => {
  const { error, value } = schema.validate(valueT, {
    abortEarly: false,
  });

  return { error, value };
};

module.exports = {
  customValidation,
};
