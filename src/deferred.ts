export class Deferred<T = void> {
  promise: Promise<T>
  resolve!: (v: T | PromiseLike<T>) => void
  reject!: (e?: unknown) => void
  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res
      this.reject = rej
    })
  }
}

export function waitForNextValue<T>(
  setup: (onValue: (value: T) => void) => () => void,
  signal?: AbortSignal
): Promise<T> {
  const deferred = new Deferred<T>()

  let cleanup = () => {}
  let settled = false

  cleanup = setup((value) => {
    if (settled) {
      return
    }
    settled = true
    cleanup()
    deferred.resolve(value)
  })

  signal?.addEventListener(
    "abort",
    () => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      deferred.reject(new Error("Aborted"))
    },
    { once: true }
  )

  return deferred.promise
}

export async function exampleUsage(signal?: AbortSignal): Promise<string> {
  const result = await waitForNextValue<string>((onValue) => {
    const timeout = setTimeout(() => onValue("value received"), 500)
    return () => clearTimeout(timeout)
  }, signal)

  return result
}
