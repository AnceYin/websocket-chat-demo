const {validate, validations} = require('ws-chat-common').validate
const sessionService = require('../service/session')

exports.list = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)

  return sessionService.list(userinfo.id)
}

exports.messageList = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.session.messageList, params)

  const {sessionId, lastSeqId, new: isNew} = params

  return sessionService.messageList(sessionId, lastSeqId, isNew)
}

exports.syncMessage = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  // params = validate(validations.session.syncMessage, params)

  // const {lastSeqId} = params

  const result = await sessionService.syncMessage(userinfo.id)

  return result
}

exports.clearUnRead = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.session.clearUnRead, params)

  const {sessionId} = params

  await sessionService.clearUnRead(userinfo.id, sessionId)
}
