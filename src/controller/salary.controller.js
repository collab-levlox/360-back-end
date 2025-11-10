const {
  getSalaryDesignAddDemoXlModalSheetService,
  createSalaryDesignModalService,
  createAttendanceDesignModalService,
  getSalaryDesignModalListService,
  salaryAddedBasedOnDesignModalService,
  salaryBaseOnDesignModalService,
  uploadBasicDataSalaryDesignModalService,
  getAttendanceDesignAddDemoXlModalSheetService,
  uploadAttendanceDataDesignModalService,
  getSalaryDetailsService,
} = require("../service/salary.service");
const catchAsync = require("../utils/catchAsync");

const getSalaryDesignAddDemoXlModalSheetController = catchAsync(
  async (req, res) => {
    const buffer = await getSalaryDesignAddDemoXlModalSheetService(req.query);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=basic_salary_bulk_add_excel.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  }
);

const getAttendanceDesignAddDemoXlModalSheetController = catchAsync(
  async (req, res) => {
    const buffer = await getAttendanceDesignAddDemoXlModalSheetService(
      req.query
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance_bulk_add_excel.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  }
);

const uploadBasicDataSalaryDesignModalController = catchAsync(
  async (req, res) => {
    const fileBuffer = req.file.buffer;
    const clientCompanyId = req.query.clientCompanyId;

    const result = await uploadBasicDataSalaryDesignModalService(
      fileBuffer,
      clientCompanyId
    );

    res
      .status(201)
      .json({ ...result, message: "Employee Uploaded Successfully" });
  }
);

const uploadAttendanceDataDesignModalController = catchAsync(
  async (req, res) => {
    const fileBuffer = req.file.buffer;
    const { clientCompanyId, monthOfSalary } = req.query;

    const result = await uploadAttendanceDataDesignModalService(
      fileBuffer,
      clientCompanyId,
      monthOfSalary
    );

    res
      .status(201)
      .json({ ...result, message: "Employee Uploaded Successfully" });
  }
);



const getSalaryDetailsController = catchAsync(async (req, res) => {
  const result = await getSalaryDetailsService(req.query);
  res.status(200).json({
     ...result,
  });
});


const salaryDesignModalCreateController = catchAsync(async (req, res) => {
  const result = await createSalaryDesignModalService(req.body);
  res.status(200).json({
    status: "successfully design modal created",
    data: result,
  });
});

const salaryAddedBasedOnDesignModalController = catchAsync(async (req, res) => {
  const result = await salaryAddedBasedOnDesignModalService(req.body);
  res.status(200).json({
    status: "successfully salary data's added ",
  });
});

const salaryBaseOnDesignModalController = catchAsync(async (req, res) => {
  const result = await salaryBaseOnDesignModalService(req.body);
  res.status(200).json({
    status: "successfully salary basic's added ",
  });
});

const getSalaryDesignModalListController = catchAsync(async (req, res) => {
  const result = await getSalaryDesignModalListService(req.query);
  res.status(200).json(result);
});

const attendanceDesignModalCreateController = catchAsync(async (req, res) => {
  const result = await createAttendanceDesignModalService(req.body);
  res.status(200).json({
    status: "successfully design modal created",
    data: result,
  });
});

module.exports = {
  getSalaryDesignAddDemoXlModalSheetController,
  salaryDesignModalCreateController,
  getSalaryDesignModalListController,
  salaryAddedBasedOnDesignModalController,
  attendanceDesignModalCreateController,
  salaryBaseOnDesignModalController,
  uploadBasicDataSalaryDesignModalController,
  getAttendanceDesignAddDemoXlModalSheetController,
  uploadAttendanceDataDesignModalController,
  getSalaryDetailsController
};
