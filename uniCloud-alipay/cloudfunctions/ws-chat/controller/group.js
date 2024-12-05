const {validate, validations} = require('ws-chat-common').validate
const groupService = require('../service/group')

exports.create = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.group.create, params)

  const {name, avatar} = params

  await groupService.create(name, avatar, userinfo.id)
}

exports.join = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.group.join, params)

  const {id} = params

  await groupService.join(id, userinfo.id)
}

exports.send = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.group.send, params)

  const {sessionId, content} = params

  const checkpoint = await groupService.send(userinfo.id, sessionId, content)

  return checkpoint
}

exports.detail = async function (params) {
  params = validate(validations.group.detail, params)

  const {sessionId} = params

  return groupService.detail(sessionId)

}

exports.leave = async function (params, userinfo) {
  userinfo = validate(validations.userinfo, userinfo)
  params = validate(validations.group.leave, params)

  const {sessionId} = params

  await groupService.leave(sessionId, userinfo.id)
}

exports.members = async function (params) {
  params = validate(validations.group.members, params)

  const {sessionId} = params

  return groupService.members(sessionId)
}
// module.exports = {
//   create: function () {},
//   join: function () {},
//   leave: function () {},
//   send: function () {},
// }
