const bytesToMegaBytes = (bytes) => bytes / 1024 ** 2
/* Drag + Drop functionallity */
document.querySelectorAll('.drop-zone__input').forEach((inputElement) => {
  const dropZoneElement = document.getElementById('imgsh')

  dropZoneElement.addEventListener('click', (e) => {
    inputElement.click()
  })

  inputElement.addEventListener('change', (e) => {
    if (inputElement.files.length && inputElement.files[0].type.match('image.*')) {
      fileChange()
      uploadFile()
      updateText(dropZoneElement, inputElement.files[0])
    }
  })

  dropZoneElement.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  ;['dragleave', 'dragend'].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {})
  })

  dropZoneElement.addEventListener('drop', (e) => {
    e.preventDefault()

    if (e.dataTransfer.files.length && e.dataTransfer.files[0].type.match('image.*')) {
      inputElement.files = e.dataTransfer.files
      updateText(dropZoneElement, e.dataTransfer.files[0])
      fileChange()
      uploadFile()
    }

    dropZoneElement.classList.remove('drop-zone--over')
  })
})

function updateText(dropZoneElement, file) {
  let thumbnailElement = dropZoneElement.querySelector('.drop-zone__prompt')
  if (thumbnailElement) {
    thumbnailElement.remove()
  }
  return
}

function fileChange() {
  let fileList = document.getElementById('fileA').files
  let file = fileList[0]

  if (!file) return
  document.getElementById('fileName').innerHTML = 'Filename: ' + file.name
  document.getElementById('fileSize').innerHTML = 'Size: ' + bytesToMegaBytes(file.size).toFixed(2) + ' MB'
  document.getElementById('progress').value = 0
  document.getElementById('prozent').innerHTML = '0%'
}

/* File Handling */

let client = null
let maxSize = 1024 * 1000 * 25

function uploadFile() {
  let file = document.getElementById('fileA').files[0]
  if (file && !file.type.match('image.*')) {
  }
  if (file.size > maxSize) {
    console.log('file is too big')
    return
  }

  let formData = new FormData()
  client = new XMLHttpRequest()

  let prog = document.getElementById('progress')
  if (!file) {
    return
  }

  prog.value = 0
  prog.max = 100

  formData.append('file', file)

  client.onerror = function (e) {
    console.log(e.message)
  }

  client.onload = function (e) {
    document.getElementById('prozent').innerHTML = '100%'
    prog.value = prog.max
  }

  client.upload.onprogress = function (e) {
    let p = Math.round((100 / e.total) * e.loaded)
    document.getElementById('progress').value = p
    document.getElementById('prozent').innerHTML = p + '%'
  }

  client.open('POST', '/upload')
  client.send(formData)
}
