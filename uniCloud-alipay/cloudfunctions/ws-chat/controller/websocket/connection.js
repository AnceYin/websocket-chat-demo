const {validate, validations} = require('ws-chat-common').validate
const {userSocketCollection, webSocketMessageActions} = require('ws-chat-common').constants

module.exports = async function connection (event) {
  const {connectionId} = event
  const query = validate(validations.websocket.connection, event.query)

  await userSocketCollection.add({
    userId: query.userId,
    connectionId,
    connectedAt: Date.now()
  })

  uniCloud.callFunction({
    name: 'ws-chat-sync',
    data: {
      type: webSocketMessageActions.syncOnlineStatus,
      data: {
        userId: query.userId,
        online: true
      }
    },
    async: true
  })
}
