class QueueAsync {
  constructor (limit = 5) {
    this.queue = []
    this.queueCount = 0
    this.queueLimit = limit

    this.endResolve = null
  }

  add (fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.handle()
    })
  }

  async handle () {
    if (this.queueCount >= this.queueLimit) {
      return
    }

    const task = this.queue.shift()

    if (!task) {
      if (this.queueCount === 0 && typeof this.endResolve === 'function') {
        Promise.resolve().then(this.endResolve)
      }

      return
    }

    const { fn, resolve, reject } = task

    this.queueCount++

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.queueCount--
        this.handle()
      })
  }

  end () {
    return new Promise((resolve) => {
      this.endResolve = resolve
    })
  }
}

module.exports = QueueAsync
