const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const { search } = require("../route");
// const multerS3 = require('multerS3')

const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext === ".xlsx" || ext === ".xls") {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/"); // <-- make sure "uploads" folder exists in your project
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// const s3 = new aws.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID, // from IAM
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const upload = multer({
// storage: multerS3({
//   s3,
//   bucket: process.env.AWS_BUCKET_NAME, // your S3 bucket name
//   acl: "public-read", // or "private" if you don’t want public access
//   key: (req, file, cb) => {
//     // unique file name in S3
//     cb(null, `uploads/${Date.now()}-${file.originalname}`);
//   },
// }),
// limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
// fileFilter: (req, file, cb) => {
//   const ext = file.originalname.split(".").pop().toLowerCase();
//   if (["pdf", "xlsx", "xls"].includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only PDF or Excel files allowed"), false);
//   }
//   },
// });

const getPayrollValidation = Joi.object({
  search: Joi.string().allow("", null),
  monthAndYear: Joi.string().optional(),
  clientCompanyId: Joi.number().integer().optional(),
  page: Joi.number().integer().min(1).required(),
  size: Joi.number().integer().min(1).optional().default(10),
});

const downloadSingleSlipValidation = Joi.object({
  empId: Joi.string().required(),
  monthYear: Joi.string().required(),
});

const downloadBulkSlipValidation = Joi.object({
  clientCompanyId: Joi.number().integer().required(),
  monthYear: Joi.string().required(),
});

module.exports = {
  excelUpload,
  getPayrollValidation,
  downloadSingleSlipValidation,
  downloadBulkSlipValidation,
};
