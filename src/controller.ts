function sleepSync(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error("Aborted"))
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t)
        reject(new Error("Aborted"))
      },
      {
        once: true,
      }
    )
  })
}

import axios from "axios"
const URL = "https://google.com"

async function fetchAsync(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal.addEventListener("abort", onAbort, { once: true })

  const REQUEST_TIMEOUT_MS = 5_000
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    await sleepSync(250, controller.signal)

    const { data } = await axios.get(URL, {
      signal: controller.signal,
    })

    console.log(data)
  } catch (error) {
    if (axios.isCancel(error) || (error as Error)?.name === "CanceledError") {
      console.log("Request cancelled by AbortController")
    } else if ((error as Error)?.message === "Aborted") {
      console.log("Operation aborted before completion")
    } else {
      console.log("Fetch failed", error)
    }
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener("abort", onAbort)
    console.log("done")
  }
}

// worker threads vs process pools

// new SharedArrayBuffer()
// new Atomics.add()

function makeAbortableSleep(ms: number) {
  const controller = new AbortController()
  return {
    controller,
    sleep: sleepSync(ms, controller.signal),
    abort: () => controller.abort(),
  }
}
