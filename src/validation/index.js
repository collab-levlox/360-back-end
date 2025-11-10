const validate = (schema, sourceOverride = null) => {
  return (req, res, next) => {
    const method = req.method.toUpperCase();

    let source = sourceOverride;

    if (!sourceOverride) {
      if (["GET", "DELETE"].includes(method)) {
        source = "query";
      } else {
        source = "body";
      }
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message.replace(/"/g, ""),
        errors: error.details.map((d) => d.message.replace(/"/g, "")),
      });
    }

    req[source] = value;
    next();
  };
};


module.exports = validate;
