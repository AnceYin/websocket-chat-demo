const Joi = require('joi')

const userinfo = Joi.object({
  id: Joi.string().required().label('user id'),
  nickname: Joi.string(),
  avatar: Joi.string()
}).required().label('userinfo')

module.exports = {
  userinfo,
  group: require('./group'),
  session: require('./session'),
  websocket: require('./websocket')
}
