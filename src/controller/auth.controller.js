const catchAsync = require("../utils/catchAsync");
const { loginUser, registerUser } = require("../service/auth.service");

const loginController = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);
  res.status(200).json({ message: "Login successful", data: result });
});

const registerController = catchAsync(async (req, res) => {
  const result = await registerUser(req.body);
  res.status(200).json({ message: "User Register successfully", data: result });

});

module.exports = {
  loginController,
  registerController,
};
