<script setup>
import {ref, toValue, onMounted, nextTick} from 'vue'
import {Loader2, UsersRound, Send, Ellipsis} from "lucide-vue-next"

import useUser from "@/hooks/use-user"
import {cn} from "@/lib/utils"
import getAvatarUrl from '@/lib/avatar'
import useOnlineStatus from "@/hooks/use-online-status";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Button} from "@/components/ui/button"
import dayjs from "dayjs"
import {toast, Toaster} from "@/components/ui/toast"

const webSocketChatCo = uniCloud.importObject('ws-chat', {
	customUI: true
})

const {userinfo} = useUser()
const {setUserStatus, onlineUsers} = useOnlineStatus()

const props = defineProps(['id'])
const emits = defineEmits(['onClose'])
const content = ref('')
const viewport = ref(null)
const detail = ref({})
const messages = ref([])
const showSetting = ref(false)
const leaveLoading = ref(false)
const members = ref([])

onMounted(() => {
	loadSessionDetail()
	loadHistoryMessage().then(() => {
		scrollToBottom('instant')
	})
	loadMembers()
})

const loadMembers = async () => {
	webSocketChatCo.groupMembers({
		sessionId: props.id
	}).then(res => {
		members.value = res.data

		res.data.forEach(member => {
			member && setUserStatus(member.id, member.online)
		})
	})
}

const loadSessionDetail = async () => {
	webSocketChatCo.groupDetail({
		sessionId: props.id
	}).then(res => {
		detail.value = res.data
	})
}

const loadHistoryMessage = async (getNew = false) => {
	const params = {
		sessionId: props.id
	}

	if (messages.value.length) {
		if (getNew) {
			params.lastSeqId = messages.value.at(-1).createdAt
			console.log(messages.value.at(-1))
			params.new = true
		} else {
			params.lastSeqId = messages.value[0].createdAt
		}
	}

	return webSocketChatCo.sessionMessageList(params, toValue(userinfo)).then(res => {
		if (getNew) {
			messages.value.push(
				...res.data.reverse()
			)
		} else {
			messages.value.unshift(
				...res.data.reverse()
			)
		}
	})
}

const scrollToBottom = (behavior = 'smooth') => {
	nextTick(() => {
		if (viewport.value) {
			viewport.value?.scrollTo({
				top: viewport.value.scrollHeight,
				behavior
			})
		}
	});
};
const sendMessage = () => {
	if (!content.value) return

	let sendText = content.value

	const randomId = Math.floor(Math.random() * 1000000)

	messages.value.push({
		id: randomId,
		type: "TEXT",
		content: sendText,
		sender: userinfo.value,
		sending: true
	})

	content.value = ''

	scrollToBottom()

	webSocketChatCo.sendGroupMessage({
		content: sendText,
		sessionId: props.id
	}, toValue(userinfo)).then(res => {
		const index = messages.value.findIndex(message => message.id === randomId)
		messages.value[index].sending = false
		messages.value[index].createdAt = res.data
	})
}

const onViewport = (vp) => {
	viewport.value = vp

	let loading = false
	vp.onscroll = function (e) {
		if (e.target.scrollTop < 300 && !loading) {
			loading = true
			loadHistoryMessage().finally(() => {
				loading = false
			})
		}
	}
}
const syncMessage = (newMessageType) => {
	loadHistoryMessage(true).then(() => {
		scrollToBottom('instant')
	})

	console.log(newMessageType)

	switch (newMessageType) {
		case "JOIN_GROUP":
		case "LEAVE_GROUP":
			loadSessionDetail()
		break
	}
}

const leaveGroup = async () => {
	leaveLoading.value = true
	webSocketChatCo.leaveGroup({
		sessionId: props.id
	}, userinfo.value).then(() => {
		emits('onClose')
	}).catch(error => {
		toast({
			variant: "destructive",
			title: "退出群聊失败",
			description: error.message
		})
	}).finally(() => {
		leaveLoading.value = false
	})
}
defineExpose({
	syncMessage
})

</script>

<template>
	<view class="flex-1 flex flex-col">
		<view class="h-[60px] flex px-4 py-2 border-solid border-b border-gray-200">
			<view class="flex-1 flex items-center">
				<text class="font-bold text-lg">{{ detail.name }}</text>
				<view v-if="detail.memberCount"
				      class="flex items-center text-xs hover:bg-gray-100 px-1 py-1 rounded-md ml-1 gap-1 text-gray-500">
					<UsersRound class="w-3.5 h-3.5"/>
					<text>{{ detail.memberCount }}</text>
				</view>
			</view>
			<view class="flex items-center">
				<Button variant="ghost" size="icon" class="w-9 h-9 bg-white cursor-pointer" @click="showSetting = !showSetting">
					<Ellipsis class="w-8 h-8" />
				</Button>
			</view>
		</view>
		<view class="h-[calc(100%-60px)] flex flex-col" v-show="!showSetting">
			<ScrollArea @onViewport="onViewport" class="flex flex-1 flex-col">
				<view
					class="flex flex-col gap-4 p-4"
					v-for="message in messages"
					:key="message.id"
				>
					<view
						:class="cn('group flex items-start gap-x-3', message.sender?.id === userinfo.id ? 'flex-row-reverse': '')"
						v-if="message.type === 'TEXT'"
					>
						<view class="relative w-10 h-10">
							<Avatar class="w-10 h-10">
								<AvatarImage :src="getAvatarUrl(message.sender?.id)"></AvatarImage>
							</Avatar>
							<view v-if="message.sender?.id !== userinfo.id" :class="cn('w-1.5 h-1.5 rounded-full absolute top-0 right-0', onlineUsers.has(message.sender?.id) ? 'bg-green-500': '')"></view>
						</view>
						<view
							:class="cn('flex-1 flex flex-col gap-y-1 max-w-[70%]', message.sender?.id === userinfo.id ? 'items-end': '')">
							<view class="flex text-gray-300 text-xs gap-x-2" v-if="message.sender?.id !== userinfo.id">
								<text>{{ message.sender?.nickname || 'unknown' }}</text>
								<text class="group-hover:block hidden">{{ dayjs(message.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</text>
							</view>
							<view
								:class="cn('flex items-center gap-x-2', message.sender?.id === userinfo.id ? 'flex-row-reverse': '')">
								<ContextMenu>
									<ContextMenuTrigger as-child>
										<text
											:class="cn('rounded-md p-2 select-text', message.sender?.id === userinfo.id ? 'bg-green-50': 'bg-gray-50')">
											{{ message.content }}
										</text>
									</ContextMenuTrigger>
									<ContextMenuContent>
										<ContextMenuItem>未实现的功能</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>
								<Loader2 v-if="message.sending" class="w-4 h-4 text-gray-300 animate-spin"/>
							</view>
						</view>
					</view>
					<view
						v-else-if="message.type === 'JOIN_GROUP' || message.type === 'LEAVE_GROUP'"
						class="text-center"
					>
						<text class="text-xs text-gray-300">{{message.content}}</text>
					</view>

					<!--				<view class="flex items-start gap-x-3">-->
					<!--					<Avatar>-->
					<!--						<AvatarImage :src="userinfo.avatar"></AvatarImage>-->
					<!--					</Avatar>-->
					<!--					<view class="flex-1 flex flex-col gap-y-1 max-w-[70%]">-->
					<!--						<view class="text-gray-300 text-xs">-->
					<!--							<text>吃猫的鱼</text>-->
					<!--						</view>-->
					<!--						<view class="flex gap-1 p-2">-->
					<!--							<text class="block w-[6px] h-[6px] rounded-full bg-gray-300 animate-bounce delay-700"></text>-->
					<!--							<text class="block w-[6px] h-[6px] rounded-full bg-gray-300 animate-bounce delay-400"></text>-->
					<!--							<text class="block w-[6px] h-[6px] rounded-full bg-gray-300 animate-bounce delay-100"></text>-->
					<!--						</view>-->
					<!--					</view>-->
					<!--				</view>-->
				</view>
			</ScrollArea>
			<view class="flex flex-col h-[240px] border-solid border-t border-gray-200 p-4 gap-y-2">
			<textarea
				class="flex-1 w-full resize-none outline-none"
				placeholder="输入消息"
				v-model="content"
			></textarea>
				<view class="flex justify-end">
					<Button class="cursor-pointer gap-2" size="sm" @click="sendMessage" :disabled="!content">
						<Send class="w-5 h-5"/>
						发送
					</Button>
				</view>
			</view>
		</view>
			<view v-show="showSetting" class="w-[450px] mx-auto p-10 flex flex-col gap-y-5">
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">设置</CardTitle>
						<CardDescription class="text-xs">群信息</CardDescription>
					</CardHeader>
					<CardContent class="gap-y-3 flex flex-col">
						<view class="flex flex-col gap-y-1">
							<text class="text-black">群ID</text>
							<text class="text-xs text-gray-500 select-text">{{ props.id }}</text>
						</view>
					</CardContent>
					<CardContent class="gap-y-3 flex flex-col">
						<view class="flex flex-col gap-y-1">
							<text class="text-black">群成员</text>
						</view>
						<ScrollArea class="max-h-[300px] min-h-[150px]">
							<view class="flex flex-col gap-y-2">
								<view class="flex gap-x-2 items-center" v-for="member in members">
									<view class="relative w-8 h-8">
										<Avatar class="w-8 h-8">
											<AvatarImage :src="getAvatarUrl(member.id)"></AvatarImage>
										</Avatar>
										<view :class="cn('w-1.5 h-1.5 rounded-full absolute top-0 right-0', onlineUsers.has(member.id) ? 'bg-green-500': '')"></view>
									</view>
									<text class="flex-1">{{member.nickname}}</text>
								</view>
							</view>
						</ScrollArea>
					</CardContent>
				</Card>

				<Button
					class="w-full cursor-pointer"
					variant="destructive"
					size="sm"
					:disabled="leaveLoading"
					@click="leaveGroup"
				>
					<Loader2 v-if="leaveLoading" class="w-4 h-4 animate-spin" />
					退出该群
				</Button>
			</view>
	</view>
	<Toaster />
</template>

<style scoped>

</style>
