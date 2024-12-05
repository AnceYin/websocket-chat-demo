<script setup>
import {ref, unref, onMounted} from 'vue'
import {Loader2} from 'lucide-vue-next'

import useUser from "@/hooks/use-user"
import getAvatarUrl from "@/lib/avatar"
import {uuid} from '@/lib/utils'

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {toast, Toaster} from "@/components/ui/toast"
import {Button} from "@/components/ui/button"
import {Input} from '@/components/ui/input'

const webSocketChatCo = uniCloud.importObject('ws-chat', {
	customUI: true
})

const emits = defineEmits(['onJoin'])

const {userinfo, setUser} = useUser()

const nickname = ref('')
const loading = ref(true)
const joinLoading = ref(false)

onMounted(() => {
	init()
})

const init = () => {
	try {
		if (userinfo.value) {
			emitJoin(userinfo.value)
		} else {
			loading.value = false
		}
	} catch (e) {
		loading.value = false
	}
}

const joinChat = () => {
	if (!nickname.value) return

	joinLoading.value = true

	const id = uuid()
	const userinfo = {
		id,
		nickname: unref(nickname),
		avatar: getAvatarUrl(id)
	}

	webSocketChatCo.createUser(userinfo).then(() => {
		emitJoin(userinfo)
	}).catch(error => {
		toast({
			variant: "destructive",
			title: "进入失败",
			description: error.message
		})
	}).finally(() => {
		joinLoading.value = false
	})
}

const emitJoin = (userinfo) => {
	setUser(userinfo)
	emits('onJoin', userinfo)
}
</script>

<template>
	<Loader2 class="w-8 h-8 text-gray-300 animate-spin" v-if="loading"/>
	<Card class="w-[450px]" v-else>
		<CardHeader>
			<CardTitle>WebSocket Chat</CardTitle>
			<CardDescription>演示支付宝云 WebSocket 功能</CardDescription>
		</CardHeader>
		<CardContent class="mt-6">
			<Input placeholder="输入你的昵称" v-model="nickname"></Input>
		</CardContent>
		<CardFooter>
			<Button class="cursor-pointer gap-x-2" :disabled="joinLoading" @click="joinChat">
				<Loader2 class="w-4 h-4 text-gray-300 animate-spin" v-if="joinLoading"/>
				进入
			</Button>
		</CardFooter>
	</Card>
	<Toaster/>
</template>
