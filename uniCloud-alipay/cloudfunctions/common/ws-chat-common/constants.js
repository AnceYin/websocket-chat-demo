const db = uniCloud.database()
exports.dbCmd = db.command
exports.groupRelationCollection = db.collection('wschat-group-relation')
exports.sessionCollection = db.collection('wschat-session')
exports.messageCollection = db.collection('wschat-message')
exports.syncCollection = db.collection('wschat-sync')
exports.userCollection = db.collection('wschat-user')
exports.userSocketCollection = db.collection('wschat-user-socket')
exports.userSessionCollection = db.collection('wschat-user-session')

exports.sessionTypes = {
  user: 'user',
  group: 'group'
}

exports.webSocketMessageActions = {
  sync: "SYNC",
  syncMessage: 'SYNC_MESSAGE',
  syncOnlineStatus: 'SYNC_ONLINE_STATUS'
}

exports.messageTypes = {
  text: "TEXT",
  joinGroup: "JOIN_GROUP",
  leaveGroup: "LEAVE_GROUP",
  system: "SYSTEM"
}

