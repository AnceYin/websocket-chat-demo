module.exports = async function error (event) {
  const {connectionId, errorMessage} = event

  console.error(`[${connectionId}] ${errorMessage}`)
}
