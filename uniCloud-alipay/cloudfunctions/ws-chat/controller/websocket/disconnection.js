const {userSocketCollection, webSocketMessageActions} = require('ws-chat-common').constants

module.exports = async function disConnection (event) {
  const {connectionId} = event

  userSocketCollection.where({
    connectionId
  }).get().then(res => {
    const user = res.data && res.data[0]

    if (!user) return

    return userSocketCollection.doc(user._id).remove().then(() => {
      return userSocketCollection.where({
        userId: user.userId
      }).get()
    }).then(socketsRes => {
      if (socketsRes.data.length) return

      return uniCloud.callFunction({
        name: 'ws-chat-sync',
        data: {
          type: webSocketMessageActions.syncOnlineStatus,
          data: {
            userId: user.userId,
            online: false
          }
        },
        async: true
      })
    })
  })
}
