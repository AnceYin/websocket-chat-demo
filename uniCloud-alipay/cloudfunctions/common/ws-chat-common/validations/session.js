const Joi = require('joi')

exports.messageList = Joi.object().keys({
  sessionId: Joi.string().required(),
  lastSeqId: Joi.number().allow(null).default(null),
  new: Joi.boolean().default(false),
})

exports.syncMessage = Joi.object().keys({
  lastSeqId: Joi.number().allow(null).default(null),
}).label('syncMessage')

exports.clearUnRead = Joi.object().keys({
  sessionId: Joi.string().required()
}).label('syncMessage')
