import { ConsulWatchOptions } from 'consul-js-common'
import { createTxnKVGetPayload, createTransaction } from 'consul-js-txn'
import { EventEmitter } from 'stream'

export type WatchInitOptions = { watchOptions: ConsulWatchOptions; handler: ReturnType<typeof createTransaction> }

export type WatchStateLocked = {
  attempt: number
  locked: true
  unlockTime: Date
  ModifyIndex: number
}

export type WatchStateUnlocked = {
  attempt: number
  locked: false
  ModifyIndex: number
}

export type WatchState = WatchStateLocked | WatchStateUnlocked

export const initWatchState: WatchStateUnlocked = {
  attempt: 0,
  locked: false,
  ModifyIndex: -1
}

export const isLockedState = (state: WatchState): state is WatchStateLocked => state.locked

export const getStateWatch = (state: Map<string, WatchState>) => () => state

export const registerKeyWatch =
  (state: Map<string, WatchState>) =>
  (consulKey: string): void => {
    if (state.get(consulKey)) return
    state.set(consulKey, initWatchState)
  }
export const registerKeysWatch =
  (register: ReturnType<typeof registerKeyWatch>) =>
  (consulKeys: Array<string>): void =>
    consulKeys.forEach(register)

export const deregisterKeyWatch =
  (state: Map<string, WatchState>) =>
  (consulKey: string): void => {
    if (!state.get(consulKey)) return
    state.delete(consulKey)
  }
export const deregisterKeysWatch =
  (deregister: ReturnType<typeof deregisterKeyWatch>) =>
  (consulKeys: Array<string>): void =>
    consulKeys.forEach(deregister)

export const unlockReady =
  (now: Date) =>
  ([key, state]: [string, WatchState]): [string, WatchState] => {
    if (isLockedState(state) && state.unlockTime.getTime() <= now.getTime()) {
      return [key, { ...state, locked: false }]
    }
    return [key, state]
  }

export const filterLocked = (entity: [string, WatchState]): boolean => !entity[1].locked

export const executePolling =
  (_events: EventEmitter) =>
  (resolver: ReturnType<typeof createTransaction>) =>
  (state: Map<string, WatchState>) =>
  async () => {
    const now = new Date()
    const mapUnlockReady = unlockReady(now)

    const txnData = Array.from(state)
      .map(mapUnlockReady)
      .filter(filterLocked)
      .map(([key]) => createTxnKVGetPayload(key))

    const txnResult = await resolver(txnData)
    console.log('txnResult', txnResult)
  }

export const run =
  (interval: number) =>
  <T extends () => any>(execute: T) =>
  (): NodeJS.Timer =>
    setInterval(execute, interval)

let timer: NodeJS.Timer | undefined

export const start = (go: () => NodeJS.Timer) => () => {
  if (timer) return timer
  return (timer = go())
}
export const stop = () => {
  if (timer) {
    clearInterval(timer)
    return (timer = undefined)
  }
}

export const init = (events: EventEmitter) => (watchStruct: WatchInitOptions) => {
  const watchKeySet = new Map<string, WatchState>()
  const executePollingWithResolver = executePolling(events)(watchStruct.handler)
  const preparedInterval = run(watchStruct.watchOptions.iterationTime)(executePollingWithResolver(watchKeySet))

  const registerKey = registerKeyWatch(watchKeySet)
  const registerKeys = registerKeysWatch(registerKey)
  const deregisterKey = deregisterKeyWatch(watchKeySet)
  const deregisterKeys = deregisterKeysWatch(deregisterKey)
  const getState = getStateWatch(watchKeySet)

  return {
    getState,
    registerKey,
    registerKeys,
    deregisterKey,
    deregisterKeys,
    start: start(preparedInterval),
    stop
  }
}
