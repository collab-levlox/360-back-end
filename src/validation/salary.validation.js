const Joi = require("joi");

const designModal = Joi.object()
  .pattern(
    /^step[0-9]+$/,
    Joi.object({
      key: Joi.string().required(),
      type: Joi.string().valid("input", "static", "formula").required(),
      value: Joi.when("type", {
        is: Joi.valid("static", "input", "formula"),
        then: Joi.alternatives().conditional("type", [
          {
            is: "static",
            then: Joi.number().required(), // static → number
          },
          {
            is: "input",
            then: Joi.valid(null).required(), // input → any value (string/number as you prefer)
          },
          {
            is: "formula",
            then: Joi.string().required(), // formula → string (could be formula text)
          },
        ]),
      }),
    })
  )
  .min(1)
  .required();


  const attendanceDesignModal = Joi.object()
  .pattern(
    /^ADstep[0-9]+$/,
    Joi.object({
      key: Joi.string().required(),
      type: Joi.string().valid("input", "static", "formula").required(),
      value: Joi.when("type", {
        is: Joi.valid("static", "input", "formula"),
        then: Joi.alternatives().conditional("type", [
          {
            is: "static",
            then: Joi.number().required(), // static → number
          },
          {
            is: "input",
            then: Joi.valid(null).required(), // input → any value (string/number as you prefer)
          },
          {
            is: "formula",
            then: Joi.string().required(), // formula → string (could be formula text)
          },
        ]),
      }),
    })
  )
  .min(1)
  .required();

const salaryModalValidation = Joi.object({
  name: Joi.string().required(),
  clientCompanyId: Joi.number().integer().required(),
  modal: designModal,
});

const attendanceModalValidation = Joi.object({
  name: Joi.string().required(),
  salaryDesignModalId: Joi.number().integer().required(),
  modal: attendanceDesignModal,
});

const getListDesignModalValidation = Joi.object({
  modal: Joi.number().valid(1, 2).required(),
  search: Joi.string().allow("").optional(),
  id: Joi.number().integer().allow(null).optional(),
  clientCompanyId: Joi.number().optional().allow(null),
});

const getSalaryDetailDemoReportValidation = Joi.object({
  clientCompanyId: Joi.number().required(),
});

const uploadAttendanceModalValidation = Joi.object({
  clientCompanyId: Joi.number().required(),
  monthOfSalary:Joi.string().required(),
});

const getSalaryDetailsValidation = Joi.object({
  page: Joi.number().required().default(1),
  size:Joi.number().optional().default(10),
  search: Joi.string().allow("").optional().default(""),
  employeeCode: Joi.number().optional(),
  employeeId:Joi.number().optional(),
  clientCompanyId: Joi.number().optional(),
  monthOfSalary: Joi.string().optional(),
})

const addSalaryDesignModalDataValidation = Joi.object({
  modal: attendanceDesignModal,
  employeeId: Joi.number().required(),
  salaryDesignModalId: Joi.number().required(),
});

module.exports = {
  salaryModalValidation,
  attendanceModalValidation,
  getListDesignModalValidation,
  addSalaryDesignModalDataValidation,
  getSalaryDetailDemoReportValidation,
  uploadAttendanceModalValidation,
  getSalaryDetailsValidation
};
