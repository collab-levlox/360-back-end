const express = require("express");
const router = express.Router();

// const apiListing = require("./listing");
// const company = require("./company");
// const employee = require("./employee");
// const payroll = require("./payroll");
// const salary = require("./salary");
// const ownCompany = require("./ownCompany");
// const bank = require("./bank");
// const invoice = require("./invoice");


// router.use("/api-listing", apiListing);
// router.get("/logCheck", (req, res) => {
//     console.log(JSON.stringify(req.query), "Logs test");
//     res.send("ok");
// });
// router.use("/own-company", ownCompany);
// router.use("/company", company);
// router.use("/employee", employee);
// router.use("/payroll", payroll);
// router.use("/salary", salary);
// router.use("/bank", bank);
// router.use("/invoice", invoice);


//

const auth = require("./auth");

const mr360 = require("./360-route");


router.use("/auth", auth);
router.use('/360', mr360)


module.exports = router;
