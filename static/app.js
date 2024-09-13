const bytesToMegaBytes = (bytes) => bytes / 1024 ** 2
/* Drag + Drop functionallity */
document.querySelectorAll('.drop-zone__input').forEach((inputElement) => {
  const dropZoneElement = document.getElementById('imgsh')

  dropZoneElement.addEventListener('click', (e) => {
    inputElement.click()
  })

  inputElement.addEventListener('change', (e) => {
    if (
      inputElement.files.length &&
      inputElement.files[0].type.match('image.*')
    ) {
      fileChange()
      uploadFile()
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

    if (
      e.dataTransfer.files.length &&
      e.dataTransfer.files[0].type.match('image.*')
    ) {
      inputElement.files = e.dataTransfer.files
      fileChange()
      uploadFile()
    }

    dropZoneElement.classList.remove('drop-zone--over')
  })
})

function fileChange() {
  let fileList = document.getElementById('file').files
  let file = fileList[0]

  if (!file) return
  document.getElementById('fileName').innerHTML = 'Filename: ' + file.name
  document.getElementById('fileSize').innerHTML =
    'Size: ' + bytesToMegaBytes(file.size).toFixed(2) + ' MB'
  document.getElementById('progress').value = 0
  document.getElementById('prozent').innerHTML = '0%'
}

/* File Handling */

let client = null
let maxSize = 1024 * 1000 * 25

function uploadFile() {
  let file = document.getElementById('file').files[0]
  if (file && !file.type.match('image.*')) {
    return
  }
  if (file.size > maxSize) {
    // TODO: clientside sizemismatch handler
    return
  }

  let formData = new FormData()
  client = new XMLHttpRequest()

  let prog = document.getElementById('progress')
  if (!file) return

  prog.value = 0
  prog.max = 100

  formData.append('file', file)

  client.onerror = function (e) {
    console.log(e.message)
  }
  client.upload.onprogress = function (e) {
    let p = Math.round((100 / e.total) * e.loaded)
    document.getElementById('progress').value = p
    document.getElementById('prozent').innerHTML = p + '%'
  }

  client.open('POST', '/upload')
  client.send(formData)

  // Checking for Response after upload.
  client.onreadystatechange = () => {
    if (client.readyState === 4) {
      // Handle Response
      const res = JSON.parse(client.response)
      successModal.style.display = 'block'
      document.getElementById('urlInput').value = res.url
      document.getElementById('deleteurlInput').value = res.removelink
      document.querySelectorAll('.copy-link').forEach((copyLinkParent) => {
        const inputField = copyLinkParent.querySelector('.copy-link-input')
        const copyButton = copyLinkParent.querySelector('.copy-link-button')

        inputField.addEventListener('focus', () => inputField.select())

        copyButton.addEventListener('click', () => {
          inputField.select()
          navigator.clipboard.writeText(inputField.value)
        })
      })
    }
  }
}

// Modal Section

// Get the modal
const successModal = document.getElementById('successModal')

// Get the <span> element that closes the modal
const closeSpan = document.getElementsByClassName('closeSpan')[0]

// When the user clicks on <span> (x), close the modal
closeSpan.onclick = function () {
  // Reset Dropzone
  document.getElementById('fileName').innerHTML =
    'Drop file here or click to upload'
  document.getElementById('fileSize').innerHTML = ''
  document.getElementById('progress').value = 0
  document.getElementById('prozent').innerHTML = ''
  // Hide Modal
  successModal.style.display = 'none'
}
