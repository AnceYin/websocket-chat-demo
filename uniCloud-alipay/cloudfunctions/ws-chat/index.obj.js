const controller = require('./controller')

module.exports = {
  _before: function () {

  },
  _after: function (error, result) {
    if (error) {
		console.error(error)
      if (error.name === 'ValidationError') {
        const errorMessage = error.details.map((details) => details.message).join(', ')
        return {
          errCode: 'ValidationError',
          errMsg: errorMessage
        }
      }

      return {
        errCode: error.name || '400',
        errMsg: error.message
      }
    }

    return {
      errCode: 0,
      errMsg: '',
      data: result || {}
    }
  },
  _onWebsocketConnection: controller.onWebsocketConnection,
  _onWebsocketMessage: controller.onWebsocketMessage,
  _onWebsocketDisConnection: controller.onWebsocketDisConnection,
  _onWebsocketError: controller.onWebsocketError,

  logout: controller.user.logout,
  createUser: controller.user.create,
  createGroup: controller.group.create,
  joinGroup: controller.group.join,
  leaveGroup: controller.group.leave,
  groupDetail: controller.group.detail,
  sendGroupMessage: controller.group.send,
  sessionList: controller.session.list,
  sessionMessageList: controller.session.messageList,
  getSyncMessage: controller.session.syncMessage,
  clearSessionUnRead: controller.session.clearUnRead,
  groupMembers: controller.group.members,
}
