document
  .getElementById("codeForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault()
    const code = document.getElementById("codeInput").value
    const password = document.getElementById("pwd").value
    const days = document.querySelector('input[name="days"]:checked').value

    const formData = new FormData()
    formData.append("code", code)
    formData.append("password", password)
    formData.append("days", days)

    const client = new XMLHttpRequest()

    client.onerror = function (e) {
      console.log(e.message)
    }

    client.open("POST", "/upload/code")
    client.send(formData)

    client.onreadystatechange = () => {
      if (client.readyState === 4) {
        const res = JSON.parse(client.response)
        if (client.status === 201) {
          successModal.style.display = "block"
          document.getElementById("urlInput").value = res.url
          document.getElementById("deleteurlInput").value = res.removelink
          document.querySelectorAll(".copy-link").forEach((copyLinkParent) => {
            const inputField = copyLinkParent.querySelector(".copy-link-input")
            const copyButton = copyLinkParent.querySelector(".copy-link-button")

            inputField.addEventListener("focus", () => inputField.select())

            copyButton.addEventListener("click", () => {
              inputField.select()
              navigator.clipboard.writeText(inputField.value)
            })
          })
        }
      }
    }
  })

// Modal Section

// Get the modal
const successModal = document.getElementById("successModal")

// Get the <span> element that closes the modal
const closeSpan = document.getElementsByClassName("closeSpan")[0]

// When the user clicks on <span> (x), close the modal
closeSpan.onclick = function () {
  // Reset Dropzone
  document.getElementById("codeInput").value = ""
  // Hide Modal
  successModal.style.display = "none"
}
