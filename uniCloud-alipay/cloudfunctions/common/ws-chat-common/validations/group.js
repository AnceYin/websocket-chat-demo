const Joi = require('joi')

exports.create = Joi.object().keys({
  name: Joi.string().required(),
})

exports.join = Joi.object().keys({
  id: Joi.string().required(),
})

exports.send = Joi.object().keys({
  sessionId: Joi.string().required(),
  content: Joi.string().required(),
})

exports.detail = Joi.object().keys({
  sessionId: Joi.string().required(),
})

exports.leave = Joi.object().keys({
  sessionId: Joi.string().required(),
})

exports.members = Joi.object().keys({
  sessionId: Joi.string().required(),
})
