import { KV_SERVICE_PATH } from './constants'
import {
  ConsulTopResolver,
  ConsulModuleResolver,
  ConsulOptions,
  RequestHandler,
  CONSUL_VERSION_PATH,
  getAuthHeader,
  getPath,
  resolveRequestOptions,
  wrapErrorHandler,
  ConsulWatchOptions
} from 'consul-js-common'
import {
  DeleteKVQueryObject,
  GetKVKeysQueryObject,
  GetKVQueryObject,
  PutKVQueryObject,
  GetKVResponse,
  GetKVKeysResponse,
  PutKVResponse,
  DeleteKVResponse
} from './types'

import { init as watchInit, WatchInitOptions } from './watch'
import { initWithResolver as initWithResolverTxn } from 'consul-js-txn'
import EventEmitter from 'events'

export const resolveWatchOptions = (options?: ConsulWatchOptions): ConsulWatchOptions =>
  options
    ? options
    : {
        iterationTime: 10 * 1000,
        lockTime: 5 * 60 * 1000,
        maxAttempts: 3
      }

export const getKV =
  (resolvers: ConsulModuleResolver<never, GetKVResponse>) =>
  async (consulKeyPath: string, query: GetKVQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('GET')(resolvers.pathResolver(consulKeyPath))({
      ...query,
      recurse: false
    })
    const getResult = await resolvers.requestHandler(options)
    return {
      ...getResult[0],
      Value: Buffer.from(getResult[0].Value, 'base64').toString()
    }
  }

export const getKeysKV =
  (resolvers: ConsulModuleResolver<never, GetKVKeysResponse>) =>
  async (consulKeyPath: string, query: GetKVKeysQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('GET')(resolvers.pathResolver(consulKeyPath))({
      ...query,
      recurse: true,
      keys: true
    })
    return resolvers.requestHandler(options)
  }

export const putKV =
  (resolvers: ConsulModuleResolver<any, PutKVResponse>) =>
  async (consulKeyPath: string, value: any, query: PutKVQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('PUT')(resolvers.pathResolver(consulKeyPath))(query)
    return resolvers.requestHandler(options, value)
  }
export const delKV =
  (resolvers: ConsulModuleResolver<never, DeleteKVResponse>) =>
  async (consulKeyPath: string, query: DeleteKVQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('DELETE')(resolvers.pathResolver(consulKeyPath))({
      ...query,
      recurse: false
    })
    return resolvers.requestHandler(options)
  }

export const delKeysKV =
  (resolvers: ConsulModuleResolver<never, DeleteKVResponse>) =>
  async (consulKeyPath: string, query: DeleteKVQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('DELETE')(resolvers.pathResolver(consulKeyPath))({
      ...query,
      recurse: true
    })
    return resolvers.requestHandler(options)
  }

// export const watchKeys = (consulKeysPath: Array<string>) => {}

export const init = (options: ConsulOptions) => (requestHandler: RequestHandler) => {
  const watchOptions = resolveWatchOptions(options.watcherOptions)
  const events = new EventEmitter()
  const topLevelResolver: ConsulTopResolver = {
    requestOptionsResolver: resolveRequestOptions({
      host: options.host || 'localhost',
      port: options.port || 8500,
      headers: getAuthHeader(options.token)
    }),
    pathResolver: getPath(CONSUL_VERSION_PATH),
    requestHandler: wrapErrorHandler(events)(requestHandler),
    events
  }
  const txnService = initWithResolverTxn(topLevelResolver)
  return initWithResolver({
    watchOptions,
    handler: txnService.createTransaction
  })(topLevelResolver)
}

export const initWithResolver = (WatchInitOptions: WatchInitOptions) => (topLevelResolver: ConsulTopResolver) => {
  const resolvers = {
    ...topLevelResolver,
    pathResolver: topLevelResolver.pathResolver(KV_SERVICE_PATH)
  }

  return {
    get: getKV(resolvers),
    getKeys: getKeysKV(resolvers),
    put: putKV(resolvers),
    del: delKV(resolvers),
    delKeys: delKeysKV(resolvers),
    watch: watchInit(resolvers.events)(WatchInitOptions)
  }
}
