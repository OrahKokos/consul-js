import { EventEmitter } from 'stream'
import { resolveRequestOptions, getPath } from './index'

export type ConsulHeaderType = 'bearer' | 'x-consul-token'

export type ConsulWatchOptions = {
  iterationTime: number
  maxAttempts: number
  lockTime: number
}

// Input options
export type ConsulOptions = {
  host: string
  port: number
  token?: {
    type: ConsulHeaderType
    value: string
  }
  watcherOptions?: ConsulWatchOptions
}

export type RequestHandler<Payload = any, Return = any> = (
  data: ConsulRequestOptions,
  payload?: Payload,
) => Return

// Headers
export type ConsulXHeader = {
  'X-Consul-Token': string
}
export type ConsulBearerHeader = {
  Authorization: `Bearer ${string}`
}

export type ConsulHeaders =
  | ConsulXHeader
  | ConsulBearerHeader
  | Record<string, never>

// Partial result
export type ConsulRequestOptionsInitPartial = {
  host: string
  port: number
  headers: ConsulHeaders
}

// Full result
export type ConsulRequestOptions = {
  method: 'GET' | 'PUT' | 'DELETE' // For now
  path: string
} & ConsulRequestOptionsInitPartial

export type ConsulTopResolver = {
  requestOptionsResolver: ReturnType<typeof resolveRequestOptions>
  pathResolver: ReturnType<typeof getPath>
  requestHandler: RequestHandler
  events: EventEmitter
}

export type ConsulModuleResolver<Payload, Return> = {
  requestOptionsResolver: ConsulTopResolver['requestOptionsResolver']
  pathResolver: ReturnType<ConsulTopResolver['pathResolver']>
  requestHandler: RequestHandler<Payload, Return>
  events: EventEmitter
}
