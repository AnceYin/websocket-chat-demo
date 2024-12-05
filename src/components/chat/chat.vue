<script setup>
import {ref, onMounted, nextTick} from 'vue'
import {Bolt, MessageCirclePlus, MessagesSquare, Users, UserRoundPlus, LogOut, Expand, Shrink} from 'lucide-vue-next'

import {cn} from "@/lib/utils"
import getAvatarUrl from "@/lib/avatar"
import useFullScreen from "@/hooks/use-full-screen"
import useUser from "@/hooks/use-user"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card";
import {ScrollArea} from "@/components/ui/scroll-area";
import JoinGroupDialog from "@/components/join-group-dialog/join-group-dialog.vue";
import CreateGroupDialog from "@/components/create-group-dialog/create-group-dialog.vue";
import Session from "@/components/session/session.vue";
import useOnlineStatus from "@/hooks/use-online-status";

const webSocketChatCo = uniCloud.importObject('ws-chat', {
	customUI: true
})

const {setFullScreenState, isFullScreen} = useFullScreen()
const {userinfo, logout} = useUser()
const {setUserStatus} = useOnlineStatus()

const sessionId = ref(null)
const sessionList = ref([])
const showJoinGroupDialog = ref(false)
const showCreateGroupDialog = ref(false)
const sessionRef = ref(null)
const connectStatus = ref(0)

onMounted(() => {
	connectWebSocket()
	loadSessionList()
})

const loadSessionList = async () => {
	webSocketChatCo.sessionList(null, userinfo.value).then(res => {
		sessionList.value = res.data
	}).then(() => {
		loadSyncMessage()
	})
}

const loadSyncMessage = async (newMessageType) => {
	console.log(newMessageType, 'newMessageType')
	webSocketChatCo.getSyncMessage(null, userinfo.value).then(res => {
		if (res.errCode !== 0) {
			console.error(res)
			return
		}
		for (const session of res.data) {
			const index = sessionList.value.findIndex(item => item.id === session.id)
			if (index === -1) continue

			if (session.lastMessage) {
				sessionList.value[index].lastMessage = session.lastMessage
			}

			if (session.id !== sessionId.value) {
				sessionList.value[index].unread = session.unread
			} else {
				clearSessionUnRead(session.id)
				sessionRef.value?.syncMessage(newMessageType)
			}
		}
	})
}

const clearSessionUnRead = (id) => {
	webSocketChatCo.clearSessionUnRead({
		sessionId: id
	}, userinfo.value).then(() => {
		const index = sessionList.value.findIndex(item => item.id === id)
		if (index !== -1) {
			sessionList.value[index].unread = 0
		}
	})
}
const openSession = async (session) => {
	if (session.id === sessionId.value) return

	sessionId.value = null

	nextTick(() => {
		if (session.unread) {
			clearSessionUnRead(session.id)
		}
		sessionId.value = session.id
	})
}

const onJoinGroupClose = async ({code} = {}) => {
	showJoinGroupDialog.value = false

	if (code === 0) {
		loadSessionList()
	}
}

const onCreateGroupClose = async ({code} = {}) => {
	showCreateGroupDialog.value = false

	if (code === 0) {
		loadSessionList()
	}
}
const connectWebSocket = async () => {
	connectStatus.value = 1
	const socketTask = await uniCloud.connectWebSocket({
		name: "ws-chat",
		query: {
			userId: userinfo.value.id
		}
	})

	socketTask.onOpen(() => {
		connectStatus.value = 2
		console.log('connect success')
	})

	socketTask.onMessage((message) => {
		const data = JSON.parse(message.data)

		switch (data.action) {
			case "SYNC":
				loadSyncMessage(data.data.contentType)
			break
			case "SYNC_ONLINE_STATUS":
				setUserStatus(data.data.userId, data.data.online)
			break
		}
	})

	socketTask.onError((e) => {
		console.log('websocket error', e)
	})

	socketTask.onClose((e) => {
		console.log('websocket close', e)
		connectWebSocket()
	})
}

const closeSession = () => {
	sessionList.value = sessionList.value.filter(session => session.id !== sessionId.value)
	sessionId.value = null
}
</script>

<template>
	<view :class="cn(
	'flex  border-solid border-gray-200 border bg-white',
			isFullScreen ? 'w-[100vw] h-[100vh]' : 'w-[80vw] h-[80vh] min-w-[640px] max-w-[1200px] rounded-xl  shadow-[0_0_30px_0_rgba(0,0,0,.05)]'
	  )">
		<view class="flex flex-col w-[280px] bg-gray-50 rounded-l-xl border-r border-gray-200">
			<view class="h-[60px] flex px-3 py-2 border-solid border-b border-gray-200 items-center">
				<view class="flex-1 flex flex-col">
					<text class="text">WebSocketChat</text>
					<text class="text-[10px] text-gray-400">展示支付宝云WebSocket能力</text>
				</view>
				<DropdownMenu>
					<DropdownMenuTrigger as-child>
<!--						 @click="showJoinGroupDialog = true"-->
						<Button variant="outline" size="icon" class="w-8 h-8 cursor-pointer">
							<MessageCirclePlus class="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem class="gap-x-2" @click="showJoinGroupDialog = true">
							<Users class="w-4 h-4" />
							加入群聊
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem class="gap-x-2" @click="showCreateGroupDialog = true">
							<UserRoundPlus class="w-4 h-4" />
							创建群聊
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</view>
			<ScrollArea class="flex flex-1 flex-col p-2">
				<view class="flex flex-col gap-2">
					<Card
						:class="cn('cursor-pointer transition hover:bg-gray-100', session.id === sessionId ? 'bg-gray-100': '')"
						v-if="sessionList.length"
						v-for="session in sessionList"
						@click="openSession(session)"
					>
						<CardContent class="p-2 flex items-center gap-2 flex-1">
							<view class="relative">
								<Avatar class="w-12 h-12">
									<AvatarImage :src="getAvatarUrl(session.id, true)"></AvatarImage>
									<AvatarFallback>NO</AvatarFallback>
								</Avatar>
								<view class="text-xs leading-none px-[4px] py-[2px] min-w-4 min-h-4 rounded-full text-white bg-red-500 absolute -top-1 -right-1 flex items-center justify-center" v-if="session.unread">{{session.unread}}</view>
							</view>
							<view class="flex flex-1 flex-col gap-1">
								<text class="text-[14px]">{{ session.name }}</text>
								<view class="text-gray-400 text-xs line-clamp-1" v-if="session.lastMessage">
									<text v-if="session.lastMessage.sender">{{session.lastMessage.sender.nickname}}: </text>
									<text>{{session.lastMessage.content}}</text>
								</view>
							</view>
						</CardContent>
					</Card>
					<view v-else class="flex flex-col gap-1 text-xs text-center text-gray-500 mt-3 select-text">
						<text>复制测试群ID，加入群聊</text>
						<text>669a53cbd3f932d862485900</text>
					</view>
				</view>
			</ScrollArea>
			<view class="flex items-center h-[50px] border-solid border-gray-200 border-t pl-2 pr-2 box-border gap-2 justify-between">
				<view class="flex flex-1 gap-2 items-center">
					<view class="relative">
						<Avatar class="w-7 h-7">
							<AvatarImage :src="userinfo.avatar"></AvatarImage>
						</Avatar>
						<view :class="cn('w-1.5 h-1.5 rounded-full absolute top-0 right-0', connectStatus === 0 ? 'bg-red-500': connectStatus === 1 ? 'bg-blue-500 animate-pulse': 'bg-green-500')"></view>
					</view>
					<text class="text-gray-500 text-[14px]">
						{{userinfo.nickname}}
					</text>
				</view>
				<DropdownMenu modal>
					<DropdownMenuTrigger as-child>
						<Button variant="outline" size="icon" class="w-8 h-8 cursor-pointer">
							<Bolt class="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="top">
						<DropdownMenuItem class="gap-x-2" @click="setFullScreenState(!isFullScreen)">
							<Shrink v-if="isFullScreen" class="w-4 h-4" />
							<Expand v-else class="w-4 h-4" />
							{{isFullScreen ? '取消全屏': '全屏显示'}}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							class="text-red-500 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white gap-x-2"
							@click="logout"
						>
							<LogOut class="w-4 h-4" />
							退出
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</view>
		</view>
		<Session ref="sessionRef" v-if="sessionId" :id="sessionId" @onClose="closeSession" />
		<view v-else class="flex flex-1 items-center justify-center">
			<MessagesSquare :stroke-width="1.2" class="text-gray-300 w-20 h-20"/>
		</view>
	</view>
	<JoinGroupDialog :open="showJoinGroupDialog" @onClose="onJoinGroupClose" />
	<CreateGroupDialog :open="showCreateGroupDialog" @onClose="onCreateGroupClose" />
</template>

<style></style>
