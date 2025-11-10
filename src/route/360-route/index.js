const express = require("express");
const router = express.Router();
// change default import -> named import
const validate = require("../../validation");
const { getDateBasedConfigController, createOrUpdateAllDaySettingController, getAllDaySettingController,deleteSettingController, getSettingListController, bookingSlotController, dashboardInfoController, bookingSlotListController } = require("../../controller/360.controler.js");
const { getDateBasedConfigValidation } = require("../../validation/360.validatation");

router.put('/setting-create-update', createOrUpdateAllDaySettingController);
router.get('/setting-list', getSettingListController);
router.get('/setting-data', getAllDaySettingController);
router.delete('/setting-delete', deleteSettingController);
router.get('/slots', validate(getDateBasedConfigValidation), getDateBasedConfigController);
router.post('/slots-book', bookingSlotController)
router.get('/booking-list', bookingSlotListController);
router.get('/dashboard-info', dashboardInfoController);
module.exports = router;
