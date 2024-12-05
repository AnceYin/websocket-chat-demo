import {ref} from 'vue'
let isFullScreen = ref(false)
export default function useFullScreen () {
  return {
    setFullScreenState (state) {
      isFullScreen.value = state
    },
    isFullScreen
  }
}
