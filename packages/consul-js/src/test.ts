import { ConsulRequestOptions } from 'consul-js-common'
import { init } from 'consul-js-kv'
import { request } from 'undici'

const buildUrl = (protocol: 'http' | 'https') => (options: ConsulRequestOptions) =>
  `${protocol}://${options.host}:${options.port}${options.path}`

const buildWithHttp = buildUrl('http')

const resolveUndiciOptions = (options: ConsulRequestOptions, body?: any) => {
  if (options.method === 'PUT') {
    return {
      method: options.method,
      headers: options.headers,
      body
    }
  }
  return {
    method: options.method,
    headers: options.headers
  }
}

const consul = init({
  host: 'consul-server',
  port: 8500,
  token: {
    type: 'x-consul-token',
    value: 'ba39356c-4414-1ef0-f558-271afd93c45d'
  }
})(async (data, payload) => {
  const url = buildWithHttp(data)
  const result = await request(url, resolveUndiciOptions(data, payload))
  const realResult = await result.body.json()
  return realResult
})

const doIt = async () => {
  const res1 = await consul.kv.get('/app-1/SERVICES/logger/LOGGER_ENABLED')
  const res2 = await consul.kv.put('/app-1/SERVICES/logger/LOGGER_ENABLED', JSON.stringify({ data: true }))
  console.log(res1, res2)
}

doIt()
