const Joi = require('joi')

exports.connection = Joi.object().keys({
  userId: Joi.string().required(),
}).label('connection')
