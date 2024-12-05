const {
  sessionCollection,
  groupRelationCollection,
  messageCollection,
  syncCollection,
  dbCmd,
  userSessionCollection,
  userCollection,
  messageTypes
} = require('ws-chat-common').constants

exports.create = async function (name, avatar, type) {
  return sessionCollection.add({
    name,
    avatar,
    type,
    createdAt: Date.now(),
  })
}

exports.list = async function (userId) {
  // TODO:: 批量获取群聊、单聊会话
  const groupRes = await groupRelationCollection.where({
    userId
  }).get()
  const sessionIds = groupRes.data.map(item => item.sessionId)

  const sessions = await sessionCollection.where({
    _id: dbCmd.in(sessionIds)
  }).get()

  for (const session of sessions.data) {
    session.id = session._id

    const lastMessage = await messageCollection.where({
      sessionId: session._id,
      type: messageTypes.text
    }).orderBy('createdAt', 'desc').limit(1).get()

    if (lastMessage.data.length > 0) {
      session.lastMessage = lastMessage.data[0]
    }

    if (session.lastMessage) {
      const user = await userCollection.doc(session.lastMessage.sender).get()

      if (user.data && user.data[0]) {
        session.lastMessage.sender = {
          id: user.data[0]._id,
          nickname: user.data[0].nickname
        }
      }
    }
  }
  return sessions.data
}

exports.messageList = async function (sessionId, lastSeqId, isNew) {
  const where = {
    sessionId
  }
  if (lastSeqId) {
    where.createdAt = isNew ? dbCmd.gt(lastSeqId): dbCmd.lt(lastSeqId)
  }

  const messages = await messageCollection.where(where).orderBy('createdAt', 'desc').limit(20).get()
  const senderIds = new Set(messages.data.map(item => item.sender))
  const senders = await userCollection.where({
    _id: dbCmd.in([...senderIds])
  }).get()

  return messages.data.map(message => {
    const sender = senders.data.find(item => item._id === message.sender)
    return {
      ...message,
      id: message._id,
      sender: sender ? {
        id: sender._id,
        nickname: sender.nickname,
      } : {}
    }
  })

}

exports.syncMessage = async (userId) => {
  // 获取用户最后同步时间
  let user = await userCollection.doc(userId).get()

  user = user.data && user.data[0]

  if (!user) return []

  // 获取用户未读消息
  const res = await syncCollection.aggregate()
    .match({
      createdAt: dbCmd.gt(user.checkpoint),
      userId
    })
    .group({
      _id: '$sessionId',
      unread: dbCmd.aggregate.sum({
        $cond: [
          dbCmd.aggregate.eq(['$type', 'TEXT']),
          1,
          0
        ]
      })
    })
    .end()

  const unReadMessages = res.data
  // 更新用户会话未读消息数
  const userSessions = await userSessionCollection.where({
    sessionId: dbCmd.in(unReadMessages.map(item => item._id)),
    userId
  }).get()

  for (const session of unReadMessages) {
    const userSession = userSessions.data.find(item => item.sessionId === session._id)
    if (userSession) {
      await userSessionCollection.doc(userSession._id).update({
        unread: dbCmd.inc(session.unread)
      })
    } else {
      await userSessionCollection.add({
        userId,
        sessionId: session._id,
        unread: session.unread,
        createdAt: Date.now()
      })
    }
  }

  // 更新用户同步时间
  const lastSyncMessages = await syncCollection.where({
    userId
  }).orderBy('createdAt', 'desc').limit(1).get()

  if (lastSyncMessages.data && lastSyncMessages.data.length) {
    await userCollection.doc(userId).update({
      checkpoint: lastSyncMessages.data[0].createdAt
    })
  }

  const sessions = await userSessionCollection.where({
    userId
  }).get()

  for (const session of sessions.data) {
    const lastMessage = await syncCollection.where({
      sessionId: session.sessionId,
      userId,
      type: messageTypes.text
    }).orderBy('createdAt', 'desc').limit(1).get()

    session.lastMessage = lastMessage.data[0]

    if (session.lastMessage) {
      const user = await userCollection.doc(session.lastMessage.sender).get()

      if (user.data && user.data[0]) {
        session.lastMessage.sender = {
          id: user.data[0]._id,
          nickname: user.data[0].nickname
        }
      }
    }
  }

  return sessions.data.map(session => ({
    id: session.sessionId,
    unread: session.unread,
    lastMessage: session.lastMessage
  }))
}

exports.clearUnRead = async function (userId, sessionId) {
  const lastMessage = await syncCollection.where({
    sessionId,
    userId
  }).orderBy('createdAt', 'desc').limit(1).get()

  if (!lastMessage.data.length) {
    return
  }

  await userSessionCollection.where({
    userId,
    sessionId
  }).update({
    unread: 0
  })
}
