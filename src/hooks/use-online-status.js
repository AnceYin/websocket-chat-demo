import {ref} from 'vue'

const onlineUsers = ref(new Set())

export default function useOnlineStatus () {

  const userIsOnline = (userId) => {
    return onlineUsers.value.has(userId)
  }

  const setUserStatus = (userId, online) => {
    if (online) {
      onlineUsers.value.add(userId)
    } else {
      onlineUsers.value.delete(userId)
    }
  }

  return {
    onlineUsers,
    setUserStatus,
    userIsOnline
  }
}
