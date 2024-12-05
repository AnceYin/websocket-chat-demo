import { ref, computed } from 'vue'

const userinfoKey = 'userinfo'
let userinfoStorage = null

try {
  userinfoStorage = uni.getStorageSync(userinfoKey)
} catch (_) {}

const user = ref(userinfoStorage)

const webSocketChatCo = uniCloud.importObject('ws-chat', {
  customUI: true
})

export default function useUser () {
  const setUser = (userinfo) => {
    uni.setStorage({
      key: userinfoKey,
      data: userinfo,
    })
    user.value = userinfo
  }

  const logout = () => {
    uni.removeStorage({key: 'userinfo'}).then(() => {
      webSocketChatCo.logout({id: user.value.id})
      setUser(null)
    })
  }

  return {
    setUser,
    userinfo: computed(() => user.value),
    logout
  }
}
