document
    .getElementById("codeForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault()
        const code = document.getElementById("codeInput").value
        const password = document.getElementById("pwd").value
        const days = document.querySelector('input[name="days"]:checked').value

        const response = await fetch("/upload/code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, password, days }),
        })

        const result = await response.json()
        if (response.ok) {
            alert("Upload successful: " + result.url)
        } else {
            alert("Upload failed: " + result.message)
        }
    })
