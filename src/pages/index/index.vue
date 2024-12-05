<script setup>
import useUser from '@/hooks/use-user'
import setup from "@/components/setup/setup.vue"
import chat from '@/components/chat/chat.vue'

const {userinfo} = useUser()
</script>

<template>
	<view class="w-[100%] h-[100%] flex items-center justify-center bg-gray-100">
		<chat v-if="userinfo?.id"></chat>
		<setup v-else></setup>
	</view>
</template>

<style></style>
