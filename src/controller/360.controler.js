const { ourCustomerDetailsService, getDateBasedConfigService, createOrUpdateAllDaySettingService, getAllDaySettingService, getSettingListService, deleteSettingService, bookingSlotService, dashboardInfoService, bookingSlotListService } = require("../service/360.service");
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/AppError');



const ourCustomerDetailsController = catchAsync(async (req, res) => {
    const responce = await ourCustomerDetailsService(req.query);
    res.json({ data: responce, message: "" });
});

const getDateBasedConfigController = catchAsync(async (req, res) => {
    const responce = await getDateBasedConfigService(req.query);
    res.json({ data: responce, message: "" });
})

const bookingSlotController = catchAsync(async (req, res) => {
    const responce = await bookingSlotService(req.body);
    res.json({ data: responce, message: "Booing Slot scuccfully" });
})

const dashboardInfoController = catchAsync(async (req, res) => {
    const responce = await dashboardInfoService(req.query);
    res.json({ data: responce, message: "Dash board details retrived scuccfully" });
});


const bookingSlotListController = catchAsync(async (req, res) => {
    const responce = await bookingSlotListService(req.query);
    res.json({ data: responce, message: "Booing Slot retrived  scuccfully" });
})

const createOrUpdateAllDaySettingController = catchAsync(async (req, res) => {
    const { courtType, startTime, endTime, holidates } = req.body;

    if (!courtType) {
        throw new Error('courtType is required', 400);
    }

    const payload = {
        courtType,
        startTime,
        endTime,
        holidates: Array.isArray(holidates) ? holidates : []
    };

    const result = await createOrUpdateAllDaySettingService({ ...payload, ...req.body });

    res.status(200).json({
        status: 'success',
        data: result
    });
});

const getAllDaySettingController = catchAsync(async (req, res) => {
    const responce = await getAllDaySettingService(req.query);
    res.json({ data: responce, message: "all day settings retrieved successfully" });
})


const getSettingListController = catchAsync(async (req, res) => {
    const responce = await getSettingListService(req.query);
    res.json(responce);
});


const deleteSettingController = catchAsync(async (req, res) => {
    const responce = await deleteSettingService(req.query);
    res.json({ data: responce, message: "setting deleted successfully" });
})

module.exports = {
    ourCustomerDetailsController,
    getDateBasedConfigController,
    createOrUpdateAllDaySettingController,
    getAllDaySettingController,
    bookingSlotController,
    getSettingListController,
    bookingSlotListController,
    deleteSettingController,
    dashboardInfoController
}