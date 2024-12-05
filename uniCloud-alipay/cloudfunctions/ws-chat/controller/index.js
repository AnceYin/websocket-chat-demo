module.exports = {
  onWebsocketConnection: require('./websocket/connection'),
  onWebsocketMessage: require('./websocket/message'),
  onWebsocketDisConnection: require('./websocket/disconnection'),
  onWebsocketError: require('./websocket/error'),

  user: require('./user'),
  group: require('./group'),
  session: require('./session')
}
