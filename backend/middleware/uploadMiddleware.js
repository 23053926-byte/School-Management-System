const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// CREATE UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}


// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {

    const uniqueName =
      "student-" +
      Date.now() +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }

});


// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }
};


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({

  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024
  }

});


module.exports = upload;
