import EventEmitter from 'events'
import {
  getPath,
  CONSUL_VERSION_PATH,
  getAuthHeader,
  resolveWithQueryParams,
  resolveRequestOptions,
  wrapErrorHandler,
} from '../src/index'

const SOME_SERVICE = '/some-service'
const SOME_PATH = '/some/path'
const SOME_QUERY = {
  a: 'a',
  b: 1,
  c: false,
  d: ['d1', 'd2', 'd3'],
}
const SOME_OPTIONS = {
  host: 'localhost',
  port: 8500,
  headers: {},
}

const removeSlash = (s: string) => s.slice(1, s.length)

describe('Consul common package', () => {
  describe('getPath', () => {
    it('Should return version and service only if last arg is empty', () => {
      const expectedResult = `${CONSUL_VERSION_PATH}${SOME_SERVICE}`
      expect(getPath(CONSUL_VERSION_PATH)(SOME_SERVICE)()).toEqual(
        expectedResult,
      )
      expect(
        getPath(removeSlash(CONSUL_VERSION_PATH))(removeSlash(SOME_SERVICE))(),
      ).toEqual(expectedResult)
    })
    it('Should return full path only if last arg is not empty', () => {
      const expectedResult = `${CONSUL_VERSION_PATH}${SOME_SERVICE}${SOME_PATH}`
      expect(getPath(CONSUL_VERSION_PATH)(SOME_SERVICE)(SOME_PATH)).toEqual(
        expectedResult,
      )
      expect(
        getPath(removeSlash(CONSUL_VERSION_PATH))(removeSlash(SOME_SERVICE))(
          removeSlash(SOME_PATH),
        ),
      ).toEqual(expectedResult)
    })
  })
  describe('getAuthHeader', () => {
    it('Should return x-consul-header on type', () => {
      expect(
        getAuthHeader({
          type: 'x-consul-token',
          value: 'someToken',
        }),
      ).toStrictEqual({
        'X-Consul-Token': 'someToken',
      })
    })
    it('Should return auth bearer on type', () => {
      expect(
        getAuthHeader({
          type: 'bearer',
          value: 'someToken',
        }),
      ).toStrictEqual({
        Authorization: 'Bearer someToken',
      })
    })
    it('Should return empty on no type', () => {
      expect(getAuthHeader()).toStrictEqual({})
    })
  })
  describe('resolveWithQueryParams', () => {
    it('Should resolve path with query params if query params object is not empty', () => {
      const expectedResult = `${SOME_PATH}?a=a&b=1&c=false&d=d1&d=d2&d=d3`
      expect(resolveWithQueryParams(SOME_QUERY)(SOME_PATH)).toEqual(
        expectedResult,
      )
    })
    it('Should resolve only path if query params object is empty', () => {
      expect(resolveWithQueryParams()(SOME_PATH)).toEqual(SOME_PATH)
    })
  })
  describe('resolveRequestOptions', () => {
    it('It should always resolve with no issue', () => {
      const x =
        resolveRequestOptions(SOME_OPTIONS)('GET')(SOME_PATH)(SOME_QUERY)
      expect(x).toStrictEqual({
        host: 'localhost',
        port: 8500,
        headers: {},
        path: '/some/path?a=a&b=1&c=false&d=d1&d=d2&d=d3',
        method: 'GET',
      })
    })
  })
  describe('wrapErrorHandler', () => {
    it('Should not emit error on no throw', async () => {
      const spy = jest.fn()
      const events = new EventEmitter()
      events.on('error', spy)
      const options =
        resolveRequestOptions(SOME_OPTIONS)('GET')(SOME_PATH)(SOME_QUERY)
      const res = await wrapErrorHandler(events)((data, payload) => {
        expect(data).toStrictEqual(options)
        expect(payload).toBeUndefined()
        return Promise.resolve(true)
      })(options)
      expect(res).toEqual(true)
      expect(spy).not.toHaveBeenCalled()
    })
    it('Should emit error on throw', async () => {
      const spy = jest.fn()
      const events = new EventEmitter()
      events.on('error', spy)
      const options =
        resolveRequestOptions(SOME_OPTIONS)('GET')(SOME_PATH)(SOME_QUERY)
      const res = await wrapErrorHandler(events)((data, payload) => {
        expect(data).toStrictEqual(options)
        expect(payload).toBeUndefined()
        throw new Error('Something')
      })(options)
      expect(res).toBeInstanceOf(Error)
      expect(spy).toHaveBeenCalled()
    })
  })
})
