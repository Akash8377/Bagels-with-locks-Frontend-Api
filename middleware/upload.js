const util = require("util");
const multer = require("multer");
const maxSize = 15 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/public/data/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now()+"_"+file.originalname);
  },
});

let uploadFile = multer({ 
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");


let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
