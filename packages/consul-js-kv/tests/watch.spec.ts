import { TxnData } from 'consul-js-txn'
import { EventEmitter } from 'events'
import {
  init,
  WatchStateUnlocked,
  WatchStateLocked,
  unlockReady,
  WatchState,
  filterLocked,
  run,
  start,
  stop,
  executePolling,
} from '../src/watch'

import { resolveWatchOptions } from '../src/index'

const wait = (time: number) => {
  return new Promise(resolve => {
    return setTimeout(resolve, time)
  })
}

const createWatchService = (handler: (data: TxnData) => any) => {
  const events = new EventEmitter()
  return init(events)({
    watchOptions: resolveWatchOptions(),
    handler,
  })
}

const defaultHandler = (data: TxnData) => {
  return Promise.resolve(data.map((_d, index) => `index-${index}`))
}

describe('Consul KV watch tests', () => {
  it('resolveWatchOptions', () => {
    const options = resolveWatchOptions()
    expect(options).toHaveProperty('iterationTime')
    expect(options).toHaveProperty('lockTime')
    expect(options).toHaveProperty('maxAttempts')
  })
  it('init', () => {
    const watchService = createWatchService(defaultHandler)
    expect(watchService).toHaveProperty('getState')
    expect(watchService).toHaveProperty('registerKey')
    expect(watchService).toHaveProperty('registerKeys')
    expect(watchService).toHaveProperty('deregisterKey')
    expect(watchService).toHaveProperty('deregisterKeys')
    expect(watchService).toHaveProperty('start')
    expect(watchService).toHaveProperty('stop')
  })
  it('getWatchState', () => {
    const watchService = createWatchService(defaultHandler)
    const state = watchService.getState()
    expect(state.size).toBe(0)
  })
  it('registerKey', () => {
    const watchService = createWatchService(defaultHandler)
    watchService.registerKey('someKey1')
    expect(watchService.getState().size).toBe(1)
    watchService.registerKey('someKey2')
    expect(watchService.getState().size).toBe(2)
    watchService.registerKey('someKey2')
    expect(watchService.getState().size).toBe(2)
  })
  it('registerKeys', () => {
    const watchService = createWatchService(defaultHandler)
    watchService.registerKeys(['someKey1', 'someKey2', 'someKey2'])
    expect(watchService.getState().size).toBe(2)
  })
  it('deregisterKey', () => {
    const watchService = createWatchService(defaultHandler)
    watchService.registerKeys(['someKey1', 'someKey2', 'someKey2'])
    watchService.deregisterKey('someKey1')
    expect(watchService.getState().size).toBe(1)
    watchService.deregisterKey('someKey2')
    expect(watchService.getState().size).toBe(0)
  })
  it('deregisterKeys', () => {
    const watchService = createWatchService(defaultHandler)
    watchService.registerKeys(['someKey1', 'someKey2', 'someKey2'])
    expect(watchService.getState().size).toBe(2)
    watchService.deregisterKeys([
      'someKey1',
      'someKey2',
      'someKey2',
      'someUnknown',
    ])
    expect(watchService.getState().size).toBe(0)
  })
  it('unlockReady', () => {
    const now = new Date()
    const unlockReadyWithDate = unlockReady(now)

    const lockedValue1: WatchStateLocked = {
      attempt: 3,
      locked: true,
      ModifyIndex: -1,
      unlockTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    }

    const unlockValue: WatchStateUnlocked = {
      attempt: 0,
      locked: false,
      ModifyIndex: -1,
    }

    const state = new Map<string, WatchState>()
    state.set('someKey1', lockedValue1)
    state.set('someKey2', unlockValue)

    const data1: Array<[string, WatchState]> = [
      ['someKey1', lockedValue1],
      ['someKey2', unlockValue],
    ]

    expect(Array.from(data1).map(unlockReadyWithDate)).toEqual(
      Array.from(data1),
    )

    const lockedValue2: WatchStateLocked = {
      attempt: 3,
      locked: true,
      ModifyIndex: -1,
      unlockTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    }
    const data2: Array<[string, WatchState]> = [
      ['someKey1', lockedValue2],
      ['someKey2', unlockValue],
    ]
    const res = Array.from(data2).map(unlockReadyWithDate)
    const toMap = new Map(res)
    expect(toMap.get('someKey1')?.locked).toBe(false)
  })
  it('filterLocked', () => {
    const now = new Date()
    const lockedValue1: WatchStateLocked = {
      attempt: 3,
      locked: true,
      ModifyIndex: -1,
      unlockTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    }

    const unlockValue: WatchStateUnlocked = {
      attempt: 0,
      locked: false,
      ModifyIndex: -1,
    }

    const state = new Map<string, WatchState>()
    state.set('someKey1', lockedValue1)
    state.set('someKey2', unlockValue)

    const res = Array.from(state).filter(filterLocked)
    expect(res.length).toBe(1)
  })
  it('run', async () => {
    const spy = jest.fn()
    const timer = run(100)(() => {
      spy()
    })()
    await wait(150)
    expect(spy).toHaveBeenCalled()
    await wait(200)
    expect(spy).toHaveBeenCalledTimes(3)
    clearInterval(timer)
  })
  it('start/stop', async () => {
    const spy = jest.fn()
    const resolveTimer = run(100)(() => {
      spy()
    })
    start(resolveTimer)()
    await wait(150)
    expect(spy).toHaveBeenCalled()
    stop()
  })
  it('executePolling', async () => {
    const watchService = createWatchService(defaultHandler)
    watchService.registerKeys(['someKey1', 'someKey2', 'someKey2'])
    const state = watchService.getState()
    const execute = executePolling(new EventEmitter())(data => {
      return Promise.resolve(data.map((_d, index) => `index-${index}`))
    })(state)
    const result = await execute()
    console.log(result)
  })
})
