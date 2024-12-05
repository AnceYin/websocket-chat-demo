module.exports = async function message (event) {
  const {connectionId, payload} = event

  console.log(`[${connectionId}] ${payload}`)
}
