const express = require("express");
const router = express.Router();
const validate = require("../validation");
const { authValidator } = require("../validation/auth.validation");
const { loginController, registerController } = require("../controller/auth.controller");

router.post("/login", validate(authValidator.login), loginController);
router.post("/register", validate(authValidator.register), registerController);

module.exports = router;
