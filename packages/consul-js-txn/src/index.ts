import {
  ConsulTopResolver,
  ConsulModuleResolver,
  ConsulOptions,
  RequestHandler,
  defaultInit,
} from 'consul-js-common'
import { TxnData, TxnKVGet, TxnKVNamespace, TxnQueryObject } from './types'
import { TXN_SERVICE_PATH } from './constants'
import { partitionTxnPayload } from './internal'

const createTxnKVGetPayload = (
  consulKey: string,
): TxnKVNamespace<TxnKVGet> => ({
  KV: {
    Verb: 'get',
    Key: consulKey,
  },
})

// Aggragate types, lose any
const createTransaction =
  (resolvers: ConsulModuleResolver<TxnData, any>) =>
  async (data: TxnData, query: TxnQueryObject = {}) => {
    const options = resolvers.requestOptionsResolver('PUT')(
      resolvers.pathResolver(),
    )(query)
    const result = await Promise.all(
      partitionTxnPayload(data).map(dataBatch => {
        return resolvers.requestHandler(options, dataBatch)
      }),
    )
    return result.flat()
  }

const init = (options: ConsulOptions) => (requestHandler: RequestHandler) =>
  defaultInit(options)(requestHandler)(initWithResolver)

const initWithResolver = (topLevelResolver: ConsulTopResolver) => {
  const resolvers = {
    ...topLevelResolver,
    pathResolver: topLevelResolver.pathResolver(TXN_SERVICE_PATH),
  }

  return {
    createTransaction: createTransaction(resolvers),
  }
}

export {
  init,
  initWithResolver,
  createTransaction,
  createTxnKVGetPayload,
  TxnData,
}
