const config = require("./config")

/* Required  Modules */
const express = require("express")
const path = require("path")
const fs = require("fs")
const hbs = require("express-handlebars")
const mongoose = require("mongoose")
const multer = require("multer")
const ShortUniqueId = require("short-unique-id")
const uid = new ShortUniqueId({ length: config.uidlength })
const cron = require("node-cron")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")

/* MongoDB Schemas */
const Image = require("./models/Image")
const Code = require("./models/Code")

/* App Variables */
const app = express()
app.disable("x-powered-by")
main().catch((err) => console.log(err))
async function main() {
  // Deprecation warning
  mongoose.set("strictQuery", false)
  await mongoose.connect(config.mongodb.connectionstring)
  if (mongoose.connection.readyState == 1) console.log("Connected to Database.")
}

/* App Middleware */
app.engine(
  "hbs",
  hbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts/",
    extname: "hbs",
  })
)
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "hbs")
app.use(express.static(path.join(__dirname, "static")))
app.use(express.static(path.join(__dirname, "uploads")))

// File upload filter for images
const uploadFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  const mimetyp = file.mimetype
  if (
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".png" ||
    mimetyp === "image/png" ||
    mimetyp === "image/jpg" ||
    mimetyp === "image/jpeg"
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}
// Filename generator for uploaded files
const fnamegen = function (req, file, cb) {
  file.filename = uid() + path.extname(file.originalname).toLowerCase()
  cb(null, file.filename)
}

// Multer middleware for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadfolder = "./uploads/"
    if (!fs.existsSync(uploadfolder)) {
      fs.mkdirSync(uploadfolder)
    }
    cb(null, uploadfolder)
  },
  filename: fnamegen,
})
const upload = multer({ storage: storage, fileFilter: uploadFilter })

/* Routes Definitions */

// Route to display the image upload page which is also the root page
app.get("/", (req, res) => {
  res.render("imageupload", { title: setTitle(req) })
})

// Route to display the code upload page
app.get("/code", (req, res) => {
  res.render("code", { title: "codesh" })
})

// Route to upload images
app.post("/upload", upload.single("file"), async (req, res) => {
  if (req.file) {
    const maxFileSize = 5 * 1024 * 1024 // 5 MiB
    if (req.file.size > maxFileSize) {
      return res.status(400).send({
        message: "File size exceeds the maximum limit of 5 MB.",
      })
    }
    const img = await Image.create({
      filename: req.file.filename,
      origName: req.file.originalname,
      shorturl: path.parse(req.file.filename).name,
      filesize: req.file.size,
      uploaderIP: req.socket.remoteAddress,
      path: req.file.path,
    })
    const domain = req.get("origin") + "/"
    res.status(201).send({
      url: domain + img.shorturl,
      removelink: domain + "delete/" + img.shorturl,
    })
  } else {
    res.status(400).send({
      message: "No file uploaded or invalid file type.",
    })
  }
})

// Route to upload code snippets
app.post("/upload/code", upload.none(), async (req, res) => {
  const { code, password, days } = req.body
  if (!code) {
    return res.status(400).send({ message: "No code provided." })
  }
  const shortCode = uid()
  const createdAt = Date.now()
  const daysToSave = parseInt(days, 10)
  const expireDate = new Date(createdAt + daysToSave * 24 * 60 * 60 * 1000) // Berechnung des Ablaufdatums

  const newCode = await Code.create({
    data: code,
    shorturl: shortCode,
    uploaderIP: req.socket.remoteAddress,
    secure: password ? true : false,
    pwd: password,
    createdAt: createdAt,
    expireDate: expireDate,
  })

  const domain = req.get("origin") + "/"
  res.status(201).send({
    url: domain + "code/" + newCode.shorturl,
    removelink: domain + "delete/code/" + newCode.shorturl,
  })
})

// Route to display the code based on the short URL given.
app.get("/code/:shorturl", async (req, res) => {
  const { shorturl } = req.params
  const codeEntry = await Code.findOne({ shorturl: shorturl })
  if (!codeEntry || codeEntry == null) {
    res.redirect("/code")
  } else if (codeEntry.secure) {
    // Check if Password is given as a query parameter
    if (req.query.password != null) {
      // Check if the password is correct and render the code if valid
      const isValid = await checkPassword(req.query.password, codeEntry.pwd)
      if (isValid) {
        res.render("displaycode", { code: codeEntry.data })
      } else {
        res.render("password", {
          shorturl: shorturl,
          error: "Incorrect password.",
        })
      }
    } else {
      res.render("password", { shorturl: shorturl })
    }
  } else {
    res.render("displaycode", { code: codeEntry.data })
  }
})

// Route to delete an imaged based on the short URL given.
app.get("/delete/:img", async (req, res) => {
  const img = await Image.findOne({ shorturl: req.params.img })
  if (!img) {
    return res.redirect("/")
  }
  await img.delete()
  res.status(200).send({
    message: "File sucessfully deleted: " + img.origName,
  })
})

// Route to delete a code snippet based on the short URL given.
app.get("/delete/code/:code", async (req, res) => {
  const code = await Code.findOne({ shorturl: req.params.code })
  if (!code) {
    return res.redirect("/code")
  }
  await code.delete()
  res.status(200).send({
    message: "File sucessfully deleted: " + code.shorturl,
  })
})

// Route to display an image based on the short URL
app.get("/:img", async (req, res) => {
  if (req.params.img !== null && req.params.img.length == 5) {
    let img = await Image.findOne({ shorturl: req.params.img })
    if (img) {
      img.hits = img.hits + 1
      await img.save()
      res.render("displayimg", {
        title: `imgsh - ${img.shorturl}`,
        imgsrc: img.filename,
      })
    }
    if (!img) return res.redirect("/")
  }
})

// Image Cleanup Job for deleting images based on the lasthit or createdAt property in the MongoDB Database
cron.schedule("*/10 * * * *", async () => {
  const maxLastHitAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  const now = Date.now()
  console.log(new Date().toLocaleString() + ": Running Image Cleanup Job")
  const images = await Image.find()

  for (const img of images) {
    const lastHitAge = now - new Date(img.lasthit).getTime()
    if (lastHitAge > maxLastHitAge) {
      await img.delete()
      console.log(`Deleted image at /${img.shorturl} Filename: ${img.origName}`)
    }
  }
})
// Code Cleanup Job for deleting expired codes based on the expireDate in the MongoDB Database
cron.schedule("*/1 * * * *", async () => {
  const now = Date.now()
  console.log(new Date().toLocaleString() + ": Running Code Cleanup Job")
  const codes = await Code.find()

  for (const code of codes) {
    const expireDate = code.expireDate.getTime()
    if (now > expireDate) {
      await code.delete()
      console.log(`Deleted code at /${code.shorturl}`)
    }
  }
})

/* Server Activation */
app.listen(config.app.port, () => {
  console.log(`Listening to requests on http://localhost:${config.app.port}`)
})

/* Helper Functions */
function setTitle(req) {
  if (req.params.img) {
    return "imgsh - " + req.params.img
  }
  return "imgsh"
}

const checkPassword = async (inputPassword, storedPasswordHash) => {
  return await bcrypt.compare(inputPassword, storedPasswordHash)
}
