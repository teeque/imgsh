const config = require('config.json')

/* Required  Modules */
const express = require('express')
const path = require('path')
const fs = require('fs')
const hbs = require('express-handlebars')
const mongoose = require('mongoose')
const multer = require('multer')
const ShortUniqueId = require('short-unique-id')
const uid = new ShortUniqueId({ length: 5 })

/* MongoDB Schemas */
const Image = require('./models/Image')
const Code = require('./models/Code')
const Page = require('./models/Page')

/* App Variables */
const app = express()
app.disable('x-powered-by')
const port = process.env.PORT || '8000'
main().catch((err) => console.log(err))
async function main() {
  await mongoose.connect('mongodb://localhost:27017/test')
}

/* App Middleware */
app.engine(
  'hbs',
  hbs.engine({
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    extname: 'hbs',
  })
)
app.use(express.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
app.use(express.static(path.join(__dirname, 'static')))
app.use(express.static(path.join(__dirname, 'uploads')))

const uploadFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  const mimetyp = file.mimetype
  if (
    ext === '.jpg' ||
    ext === '.jpeg' ||
    ext === '.png' ||
    mimetyp === 'image/png' ||
    mimetyp === 'image/jpg' ||
    mimetyp === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}
const fnamegen = function (req, file, cb) {
  file.filename = uid() + path.extname(file.originalname).toLowerCase()
  cb(null, file.filename)
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: fnamegen,
})
const upload = multer({ storage: storage, fileFilter: uploadFilter })

/* Routes Definitions */
app.get('/', (req, res) => {
  res.render('index', { title: setTitle(req) })
})

app.post('/upload', upload.single('file'), async (req, res) => {
  if (req.file) {
    const img = await Image.create({
      filename: req.file.filename,
      origName: req.file.originalname,
      shorturl: path.parse(req.file.filename).name,
      filesize: req.file.size,
      uploaderIP: req.socket.remoteAddress,
      path: req.file.path,
    })
  }
})

app.get('/admin/:id?', (req, res) => {
  if (req.params.id == 'enter') {
    res.render('admin', { title: setTitle(req) })
  }
  res.render('index', { title: setTitle(req) })
})

app.get('/delete/:img', async (req, res) => {
  const img = await Image.findOne({ shorturl: req.params.img })
  img.delete()
  res.status(200).send({ message: JSON.stringify(img) })
})

app.get('/:img', async (req, res) => {
  if (req.params.img !== null && req.params.img.length == 5) {
    let img = await Image.findOne({ shorturl: req.params.img })
    img.hits++
    await img.save()
    res.render('img', { title: setTitle(req), imgsrc: img.filename })
  }
})

/* Server Activation */
app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`)
})

/* Helper Functions */
function setTitle(req) {
  if (req.params.img) {
    return 'imgsh - ' + req.params.img
  }
  return 'imgsh'
}
