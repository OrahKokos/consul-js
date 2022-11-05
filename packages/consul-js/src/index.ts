import { EventEmitter } from 'stream'
import {
  resolveRequestOptions,
  getPath,
  getAuthHeader,
  ConsulOptions,
  RequestHandler,
  CONSUL_VERSION_PATH,
  ConsulTopResolver,
  wrapErrorHandler
} from 'consul-js-common'
import { initWithResolver as initKV, resolveWatchOptions } from 'consul-js-kv'
import { initWithResolver as initTxn } from 'consul-js-txn'

// What
export const start = (options: ConsulOptions) => (requestHandler: RequestHandler) => {
  const events = new EventEmitter()
  const topLevelResolver: ConsulTopResolver = {
    requestOptionsResolver: resolveRequestOptions({
      host: options.host || 'localhost',
      port: options.port || 8500,
      headers: getAuthHeader(options.token)
    }),
    pathResolver: getPath(CONSUL_VERSION_PATH),
    requestHandler: wrapErrorHandler(events)(requestHandler),
    events: new EventEmitter()
  }

  const txn = initTxn(topLevelResolver)

  const kv = initKV({ watchOptions: resolveWatchOptions(options.watcherOptions), handler: txn.createTransaction })(
    topLevelResolver
  )

  return {
    txn,
    kv
  }
}
