const {userCollection} = require('ws-chat-common').constants

exports.create = async function (uuid, nickname, avatar) {
  const user = await userCollection.doc(uuid).get()
  if (user.data.length) return

  await userCollection.add({
    _id: uuid,
    nickname,
    avatar,
    checkpoint: Date.now(),
    createdAt: Date.now(),
  })
}

exports.logout = async function (userId) {
  await userCollection.doc(userId).update({
    isLogout: true
  })
}
