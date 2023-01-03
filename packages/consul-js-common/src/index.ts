import { stringify, ParsedUrlQueryInput } from 'querystring'
import { normalize } from 'path'
import EventEmitter from 'events'

import { CONSUL_VERSION_PATH_V1 } from './constants'
import {
  ConsulOptions,
  ConsulHeaders,
  ConsulRequestOptionsInitPartial,
  ConsulRequestOptions,
  RequestHandler,
  ConsulTopResolver,
  ConsulModuleResolver,
  ConsulWatchOptions,
} from './types'

const getPath =
  (version: string) =>
  (service: string) =>
  (consulPath = '') => {
    if (consulPath) return normalize(`/${version}/${service}/${consulPath}`)
    return normalize(`/${version}/${service}`)
  }

const getAuthHeader = (
  tokenOptions?: ConsulOptions['token'],
): ConsulHeaders => {
  if (!tokenOptions) return {}
  if (tokenOptions.type === 'x-consul-token') {
    return {
      'X-Consul-Token': tokenOptions.value,
    }
  }
  if (tokenOptions.type === 'bearer') {
    return {
      Authorization: `Bearer ${tokenOptions.value}`,
    }
  }
  return {}
}

const resolveWithQueryParams =
  <T extends Record<PropertyKey, unknown> | undefined>(query?: T) =>
  (fullPath: string) => {
    const queryString = stringify(query as ParsedUrlQueryInput)
    if (queryString) {
      return `${fullPath}?${queryString}`
    }
    return fullPath
  }

const resolveRequestOptions =
  (reqOpts: ConsulRequestOptionsInitPartial) =>
  (method: 'GET' | 'PUT' | 'DELETE') =>
  (path: string) =>
  <T extends Record<PropertyKey, unknown>>(query: T): ConsulRequestOptions => ({
    ...reqOpts,
    path: resolveWithQueryParams(query)(path),
    method,
  })

const wrapErrorHandler =
  (emitter: EventEmitter) =>
  <T extends (options: ConsulRequestOptions, value?: unknown) => unknown>(
    handler: T,
  ) =>
  async (options: ConsulRequestOptions, value?: unknown) => {
    try {
      return handler(options, value)
    } catch (e) {
      emitter.emit('error', e)
      return e
    }
  }

const defaultInit =
  (options: ConsulOptions) =>
  (requestHandler: RequestHandler) =>
  <T>(init: T) => {
    const events = new EventEmitter()
    const topLevelResolver: ConsulTopResolver = {
      requestOptionsResolver: resolveRequestOptions({
        host: options.host || 'localhost',
        port: options.port || 8500,
        headers: getAuthHeader(options.token),
      }),
      pathResolver: getPath(CONSUL_VERSION_PATH_V1),
      requestHandler: wrapErrorHandler(events)(requestHandler),
      events,
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return init(topLevelResolver)
  }

export {
  defaultInit,
  getPath,
  getAuthHeader,
  resolveWithQueryParams,
  resolveRequestOptions,
  wrapErrorHandler,
  CONSUL_VERSION_PATH_V1,
  ConsulOptions,
  ConsulWatchOptions,
  RequestHandler,
  ConsulRequestOptionsInitPartial,
  ConsulRequestOptions,
  ConsulTopResolver,
  ConsulModuleResolver,
}
