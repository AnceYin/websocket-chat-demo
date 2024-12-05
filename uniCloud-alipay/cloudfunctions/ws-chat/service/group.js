const {constants} = require('ws-chat-common')

const {
  groupRelationCollection,
  sessionCollection,
  sessionTypes,
  messageCollection,
  messageTypes,
  userCollection,
  userSessionCollection,
  syncCollection,
  webSocketMessageActions,
  userSocketCollection,
  dbCmd
} = constants
const sessionService = require('./session')

const ws = uniCloud.webSocketServer()

exports.create = async function (name, avatar, creator) {
  const session = await sessionService.create(name, avatar, sessionTypes.group)

  await groupRelationCollection.add({
    userId: creator,
    isCreator: true,
    sessionId: session.id,
    joinAt: Date.now()
  })
}

exports.join = async function (sessionId, joiner) {
  const session = await sessionCollection.doc(sessionId).get()

  if (!session.data.length) {
    throw new Error('session id not found')
  }

  const group = await groupRelationCollection.where({
    sessionId,
    userId: joiner
  }).get()

  if (group.data.length) {
    throw new Error('already joined')
  }

  await groupRelationCollection.add({
    userId: joiner,
    isCreator: false,
    sessionId: sessionId,
    joinAt: Date.now()
  })

  userCollection.doc(joiner).get().then((res) => {
    const userinfo = res.data && res.data[0]
    if (userinfo) {
      return exports.send(
        null,
        sessionId,
        `${userinfo.nickname} 加入群聊`,
        messageTypes.joinGroup,
        [joiner]
      )
    }
  })

  await messageCollection
}

exports.send = async function (sender, sessionId, content, type = messageTypes.text, excludeSenders = []) {
  const messageCreatedAt = Date.now()
  // 消息写入消息存储表
  await messageCollection.add({
    sender,
    sessionId,
    content,
    type,
    createdAt: messageCreatedAt
  })
  // 同步消息
  uniCloud.callFunction({
    name: 'ws-chat-sync',
    data: {
      type: webSocketMessageActions.sync,
      data: {
        sessionId,
        content,
        type,
        sender,
        excludeSenders
      }
    },
    async: true
  })

  return messageCreatedAt
}

exports.detail = async function (sessionId) {
  let session = await sessionCollection.doc(sessionId).get()

  session = session.data && session.data[0]

  if (!session) {
    throw new Error('session not found')
  }

  const groupMemberCount = await groupRelationCollection.where({
    sessionId
  }).count()

  session.memberCount = groupMemberCount.total

  return session
}

exports.leave = async function (sessionId, userId) {
  await Promise.all([
    // 解除用户与群的关系
    groupRelationCollection.where({
      userId,
      sessionId
    }).remove(),
    // 删除用户在群的未读消息
    userSessionCollection.where({
      userId,
      sessionId
    }).remove(),
    // 删除用户在群的同步消息
    syncCollection.where({
      userId,
      sessionId
    }).remove()
  ])

  userCollection.doc(userId).get().then((res) => {
    const userinfo = res.data && res.data[0]
    if (userinfo) {
      return exports.send(
        null,
        sessionId,
        `${userinfo.nickname} 退出群聊`,
        messageTypes.leaveGroup,
        [userId]
      )
    }
  })

  // 群内没有群成员时解散该群
  groupRelationCollection.where({
    sessionId
  }).count().then(({total}) => {
    if (total <= 0) {
      sessionCollection.doc(sessionId).remove()
    }
  })
}

exports.members = async function (sessionId) {
  const groupMembers = await groupRelationCollection.where({
    sessionId
  }).get()

  const memberSockets = await userSocketCollection.where({
    userId: dbCmd.in(groupMembers.data.map((member) => member.userId))
  }).get()

  const users = await userCollection.where({
    _id: dbCmd.in(groupMembers.data.map((member) => member.userId))
  }).get()

  return groupMembers.data.map((member) => {
    const socket = memberSockets.data.find((socket) => socket.userId === member.userId)
    const user = users.data.find((user) => user._id === member.userId)

    if (!user) {
      return null
    }

    return {
      id: user._id,
      nickname: user.nickname,
      online: Boolean(socket)
    }
  })
}
