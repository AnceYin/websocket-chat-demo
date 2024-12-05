const {queue: QueueAsync} = require('ws-chat-common')
const {
	groupRelationCollection,
	syncCollection,
	userSocketCollection,
	webSocketMessageActions,
	dbCmd
} = require("ws-chat-common").constants

const ws = uniCloud.webSocketServer()

async function syncMessage ({sender, sessionId, content, type, excludeSenders = []}) {
	if (!sessionId || !content) {
		return "Missing sessionId or content"
	}

	const groupMembers = await groupRelationCollection.where({
		sessionId
	}).get()

	if (!groupMembers.data.length) {
		return "No group members found"
	}

	const sync = async (member) => {
		// 添加消息同步记录
		await syncCollection.add({
			sender,
			userId: member.userId,
			sessionId,
			content,
			type,
			createdAt: Date.now()
		})

		// 给在线推送新消息通知
		const sockets = await userSocketCollection.where({
			userId: member.userId
		}).get()

		if (!sockets.data.length) {
			return "No sockets found"
		}

		const socketConnIds = sockets.data.map(item => item.connectionId).filter(Boolean)

		if (socketConnIds.length) {
			ws.send(socketConnIds, {
				action: webSocketMessageActions.sync,
				data: {
					contentType: type
				}
			})
		}
	}

	const queue = new QueueAsync(100)
	groupMembers.data.forEach(item => {
		if (!excludeSenders.length || !excludeSenders.includes(item.userId)) {
			queue.add(async () => {
				await sync(item)
			})
		}
	})

	await queue.end()

	return "ok"
}

async function syncOnlineStatus ({userId, online = true}) {
	const userSessions = await groupRelationCollection.where({
		userId
	}).get()

	if (!userSessions.data.length) return 'No user sessions found'

	const sessionUsers = await groupRelationCollection.aggregate()
		.match({
			sessionId: dbCmd.in(userSessions.data.map(session => session.sessionId).filter(Boolean))
		})
		.group({
			_id: '$userId'
		})
		.end()

	const queue = new QueueAsync(100)
	const sync = async (member) => {
		const sockets = await userSocketCollection.where({
			userId: member._id
		}).get()

		if (!sockets.data.length) {
			return "No sockets found"
		}

		const socketConnIds = sockets.data.map(item => item.connectionId).filter(Boolean)

		if (socketConnIds.length) {
			ws.send(socketConnIds, {
				action: webSocketMessageActions.syncOnlineStatus,
				data: {
					userId,
					online
				}
			})
		}
	}

	sessionUsers.data.forEach(item => {
		queue.add(async () => {
			await sync(item)
		})
	})

	await queue.end()
}

exports.main = async (event) => {
	const {type, data} = event

	switch (type) {
		case webSocketMessageActions.sync:
			return syncMessage(data)
		case webSocketMessageActions.syncOnlineStatus:
			return syncOnlineStatus(data)
		default:
			return "Unknown action"
	}
};
