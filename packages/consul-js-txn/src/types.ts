// KV
export type TxnKVSet = {
  Verb: 'set'
  Key: string
  Value: string
  Flags?: number
}

export type TxnKVCas = {
  Verb: 'cas'
  Key: string
  Value: string
  Flags?: number
  Index: number
}

export type TxnKVLock = {
  Verb: 'lock'
  Key: string
  Value: string
  Flags?: number
  Session: string
}
export type TxnKVUnlock = {
  Verb: 'unlock'
  Key: string
  Value: string
  Flags?: number
  Session: string
}

export type TxnKVGet = {
  Verb: 'get'
  Key: string
}

export type TxnKVGetTree = {
  Verb: 'get-tree'
  Key: string
}

export type TxnKVCheckIndex = {
  Verb: 'check-index'
  Key: string
  Index: number
}

export type TxnKVCheckSession = {
  Verb: 'check-index'
  Key: string
  Session: string
}

export type TxnKVCheckNotExists = {
  Verb: 'check-not-exists'
  Key: string
}

export type TxnKVDelete = {
  Verb: 'delete'
  Key: string
}

export type TxnKVDeleteTree = {
  Verb: 'delete-tree'
  Key: string
}

export type TxnKVDeleteCas = {
  Verb: 'delete-cas'
  Key: string
}

export type TxnKVNamespace<T> = {
  KV: T
}

export type TxnKVPayload = TxnKVNamespace<
  | TxnKVSet
  | TxnKVCas
  | TxnKVLock
  | TxnKVUnlock
  | TxnKVGet
  | TxnKVGetTree
  | TxnKVCheckIndex
  | TxnKVCheckSession
  | TxnKVCheckNotExists
  | TxnKVDelete
  | TxnKVDeleteTree
  | TxnKVDeleteCas
>

// Node - Not Implemented
export type TxnNodeSet = {
  Verb: 'set'
}
export type TxnNodeCas = {
  Verb: 'cas'
}
export type TxnNodeGet = {
  Verb: 'get'
}
export type TxnNodeDelete = {
  Verb: 'delete'
}
export type TxnNodeDeleteCas = {
  Verb: 'delete-cas'
}

export type TxnNodePayload =
  | TxnNodeSet
  | TxnNodeCas
  | TxnNodeGet
  | TxnNodeDelete
  | TxnNodeDeleteCas

// Service - Not Implemented
export type TxnServiceSet = {
  Verb: 'set'
}
export type TxnServiceCas = {
  Verb: 'cas'
}
export type TxnServiceGet = {
  Verb: 'get'
}
export type TxnServiceDelete = {
  Verb: 'delete'
}
export type TxnServiceDeleteCas = {
  Verb: 'delete-cas'
}

export type TxnServicePayload = {
  Service:
    | TxnServiceSet
    | TxnServiceCas
    | TxnServiceGet
    | TxnServiceDelete
    | TxnServiceDeleteCas
}

// Check - Not Implemented
export type TxnCheckSet = {
  Verb: 'set'
}
export type TxnCheckCas = {
  Verb: 'cas'
}
export type TxnCheckGet = {
  Verb: 'get'
}
export type TxnCheckDelete = {
  Verb: 'delete'
}
export type TxnCheckDeleteCas = {
  Verb: 'delete-cas'
}

export type TxnCheckPayload = {
  Check:
    | TxnCheckSet
    | TxnCheckCas
    | TxnCheckGet
    | TxnCheckDelete
    | TxnCheckDeleteCas
}

export type TxnData = Array<
  TxnKVPayload | TxnNodePayload | TxnServicePayload | TxnCheckPayload
>

export type TxnQueryObject =
  | {
      dc: string
    }
  | Record<PropertyKey, never>
