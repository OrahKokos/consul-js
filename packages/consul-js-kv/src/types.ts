// GET
export type GetKVQueryObject =
  | {
      dc: string
      raw: boolean
      separator: string
      ns: string
      keys: false
      recurse: false
    }
  | Record<PropertyKey, unknown>

export type GetKVKeysQueryObject =
  | {
      dc: string
      raw: boolean
      separator: string
      ns: string
      keys: true
      recurse: true
    }
  | Record<PropertyKey, unknown>

export type GetKVKeysResponse = Array<string>

export type SingleGetKVResponse = {
  CreateIndex: number
  ModifyIndex: number
  LockIndex: number
  Key: string
  Flags: number
  Value: string
  Session: string
}

export type GetKVResponse = Array<SingleGetKVResponse>

// PUT
export type PutKVQueryObject =
  | {
      dc: string
      flags: number
      cas: number
      acquire: string
      release: string
      ns: string
    }
  | Record<PropertyKey, unknown>

export type PutKVResponse = boolean

// Delete
export type DeleteKVQueryObject =
  | {
      dc: string
      recurse: boolean
      cas: number
      ns: string
    }
  | Record<PropertyKey, unknown>

export type DeleteKVResponse = boolean
