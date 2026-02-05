const vscode = window.acquireVsCodeApi()

const messagesDiv = document.getElementById("messages")
const inputField = document.getElementById("input")
const sendButton = document.getElementById("send")

const messages = []

function addMessage(text, isUser) {
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${isUser ? "user" : "assistant"}`
  messageDiv.textContent = text
  messagesDiv.appendChild(messageDiv)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
  messages.push({ text, isUser, timestamp: new Date() })
}

function sendMessage() {
  const text = inputField.value.trim()
  if (!text) return

  addMessage(text, true)
  inputField.value = ""

  // Send to extension backend
  vscode.postMessage({
    type: "chat",
    message: text,
    timestamp: new Date().toISOString(),
  })

  // Show loading indicator
  const loadingDiv = document.createElement("div")
  loadingDiv.className = "loading"
  loadingDiv.id = "loading"
  loadingDiv.textContent = "Thinking..."
  messagesDiv.appendChild(loadingDiv)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
}

// Listen for messages from extension
window.addEventListener("message", (event) => {
  const data = event.data

  switch (data.type) {
    case "response":
      const loadingDiv = document.getElementById("loading")
      if (loadingDiv) loadingDiv.remove()
      addMessage(data.text, false)
      break

    case "error":
      const errorDiv = document.getElementById("loading")
      if (errorDiv) errorDiv.remove()
      addMessage(`Error: ${data.message}`, false)
      break

    case "status":
      console.log("[v0] Status update:", data.status)
      break
  }
})

// Send on button click or Enter key
sendButton.addEventListener("click", sendMessage)
inputField.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

// Initialize - no mock data, real connection check
window.addEventListener("load", () => {
  vscode.postMessage({
    type: "init",
    timestamp: new Date().toISOString(),
  })
})
