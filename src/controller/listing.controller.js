const { log } = require("winston");
const listingService = require("../service/listing.service");

const catchAsync = require("../utils/catchAsync");

const listingData = catchAsync(async (req, res, next) => {
  const list = await listingService.listingAllData(req.query);
  res.json(list);
});

const listingCategoryData = catchAsync(async (req, res, next) => {
  const list = await listingService.listingAllCategory();
  console.log(list, "list");
  
  res.json(list);
});

module.exports = {
  listingData,
  listingCategoryData,
};
