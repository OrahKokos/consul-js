import { ConsulTopResolver, resolveRequestOptions, getPath, CONSUL_VERSION_PATH } from 'consul-js-common'
import { EventEmitter } from 'stream'
import { initWithResolver, init, createTxnKVGetPayload } from '../src/index'
import { getTargetIndex, toPartitions, partitionTxnPayload } from '../src/internal'

const wait = (milsec) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, milsec)
  })
}

describe('Consul JS TXN tests', () => {
  describe('Internals', () => {
    it('createTxnKVGetPayload', () => {
      expect(createTxnKVGetPayload('someString')).toStrictEqual({
        KV: {
          Verb: 'get',
          Key: 'someString'
        }
      })
    })
    it('getTargetIndex', () => {
      const getTargetIndexFor = getTargetIndex(64)
      expect(getTargetIndexFor(1)).toBe(0)
      expect(getTargetIndexFor(63)).toBe(0)
      expect(getTargetIndexFor(64)).toBe(1)
      expect(getTargetIndexFor(127)).toBe(1)
      expect(getTargetIndexFor(128)).toBe(2)
    })
    it('toPartitions', () => {
      const toPartitionSize = toPartitions(64)
      expect(toPartitionSize([...Array(0).keys()]).length).toEqual(0)
      expect(toPartitionSize([...Array(64).keys()]).length).toEqual(1)
      expect(toPartitionSize([...Array(128).keys()]).length).toEqual(2)
    })
    it('partitionTxnPayload', () => {
      expect(partitionTxnPayload([]).length).toBe(0)
      expect(
        partitionTxnPayload([...Array(64).keys()].map((index) => createTxnKVGetPayload(`index-${index}`))).length
      ).toBe(1)
      expect(
        partitionTxnPayload([...Array(128).keys()].map((index) => createTxnKVGetPayload(`index-${index}`))).length
      ).toBe(2)
    })
  })
  describe('Exports', () => {
    it('initWithResolver', () => {
      const topLevelResolver: ConsulTopResolver = {
        requestOptionsResolver: resolveRequestOptions({
          host: 'localhost',
          port: 8500,
          headers: {}
        }),
        pathResolver: getPath(CONSUL_VERSION_PATH),
        requestHandler: (_data, _payload) => true,
        events: new EventEmitter()
      }
      const txnService = initWithResolver(topLevelResolver)
      expect(txnService).toHaveProperty('createTransaction')
    })
    it('init', () => {
      const txnService = init({
        host: 'localhost',
        port: 8500
      })((_data, _payload) => true)
      expect(txnService).toHaveProperty('createTransaction')
    })
    it('createTransaction', async () => {
      const spy = jest.fn()
      const topLevelResolver: ConsulTopResolver = {
        requestOptionsResolver: resolveRequestOptions({
          host: 'localhost',
          port: 8500,
          headers: {}
        }),
        pathResolver: getPath(CONSUL_VERSION_PATH),
        requestHandler: async (data, payload) => {
          expect(data.host).toBe('localhost')
          expect(data.port).toBe(8500)
          expect(payload).toBeInstanceOf(Array)
          expect(payload.length).toBeLessThanOrEqual(64)
          spy()
          await wait(200)
          return Promise.resolve(payload.map((_x, index) => index))
        },
        events: new EventEmitter()
      }
      const txnService = initWithResolver(topLevelResolver)

      const emptyResult = await txnService.createTransaction([])
      expect(emptyResult.length).toBe(0)
      expect(spy).not.toHaveBeenCalled()

      const result64 = await txnService.createTransaction(
        [...Array(64).keys()].map((index) => createTxnKVGetPayload(`index-${index}`))
      )
      expect(result64.length).toBe(64)
      expect(spy).toHaveBeenCalledTimes(1)

      spy.mockClear()

      const result128 = await txnService.createTransaction(
        [...Array(128).keys()].map((index) => createTxnKVGetPayload(`index-${index}`))
      )
      expect(result128.length).toBe(128)
      expect(spy).toHaveBeenCalledTimes(2)

      spy.mockClear()
    })
  })
})
