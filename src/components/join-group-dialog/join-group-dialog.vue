<script setup>
import {ref} from 'vue'
import {DialogPortal} from "radix-vue"
import {Loader2} from "lucide-vue-next"

import useUser from "@/hooks/use-user"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from "@/components/ui/button"
import {toast, Toaster} from '@/components/ui/toast'

const {userinfo} = useUser()

const props = defineProps(['open'])
const emits = defineEmits(['onClose'])

const webSocketChatCo = uniCloud.importObject('ws-chat', {
	customUI: true
})

const groupId = ref('')
const joinLoading = ref(false)

const close = (value) => {
	emits('onClose', value)
}

const joinGroup = () => {
	if (!groupId.value) return
	joinLoading.value = true

	webSocketChatCo.joinGroup({
		id: groupId.value
	}, userinfo.value).then(res => {
		close({
			code: 0
		})
	}).catch(error => {
		toast({
			variant: "destructive",
			title: "加入群失败",
			description: error.message
		})
	}).finally(() => {
		joinLoading.value = false
	})
}

</script>

<template>
	<Dialog :open="props.open" @update:open="close">
		<DialogPortal>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>添加群</DialogTitle>
					<DialogDescription>
						输入群ID加入群聊
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Input v-model="groupId" />
				</DialogFooter>
				<DialogFooter class="sm:justify-start">
					<Button variant="secondary" class="cursor-pointer gap-1" @click="joinGroup" :disabled="joinLoading">
						<Loader2 class="w-4 h-4 text-gray-300 animate-spin" v-if="joinLoading"/>
						加入
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogPortal>
	</Dialog>
	<Toaster />
</template>

<style scoped>

</style>
