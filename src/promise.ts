import axios from "axios"

const sleep: (ms: number) => Promise<void> = (ms: number) =>
  new Promise<void>((resolve, _) => setTimeout(() => resolve(), ms))

const url = "https://google.com/"

const networkCallWithTimeoutAndAbortSignalPromise: (
  ms: number,
  signal?: AbortSignal
) => Promise<void> = (ms: number = 1000, signal?: AbortSignal) =>
  new Promise<void>((resolveDelay, rejectDelay) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const onAbort = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
      rejectDelay(new Error("Signal Aborted"))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener("abort", onAbort, { once: true })

    timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolveDelay()
    }, ms)
  })
    .then(() => {
      console.log("starting network call")
      return axios.get(url, {
        signal: signal,
      })
    })
    .then((response) => {
      console.log("fetched")
    })
    .catch((err) => console.error(err))

const signalAbortAfterTimeoutPromise = (
  ms: number,
  controller: AbortController
) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve()
      console.log("signalling abort")
      controller.abort()
    }, ms)
  })

const main = async () => {
  console.log("start")
  const controller = new AbortController()
  await Promise.all([
    networkCallWithTimeoutAndAbortSignalPromise(2000, controller.signal),
    signalAbortAfterTimeoutPromise(1000, controller),
  ])
  console.log("end")
}

main()
