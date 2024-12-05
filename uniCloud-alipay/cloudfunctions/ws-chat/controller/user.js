const {validate, validations} = require('ws-chat-common').validate
const userService = require('../service/user')

exports.create = async function (params) {
  params = validate(validations.userinfo, params)

  const {id, nickname, avatar} = params

  await userService.create(id, nickname, avatar)
}

exports.logout = async function (params) {
  const {id} = params

  if (id) {
    await userService.logout(id)
  }
}
