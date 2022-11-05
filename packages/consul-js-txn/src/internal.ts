import { MAX_PAYLOAD } from './/constants'
import { TxnData } from './types'

export const getTargetIndex = (size: number) => (index: number) => Math.floor(index / size)

export const toPartitions =
  (size: number) =>
  <T extends Array<any>>(unpartitionedParray: T): Array<T> => {
    const getTargetIndexForSize = getTargetIndex(size)
    return unpartitionedParray.reduce((acc, data, index) => {
      const targetIndex = getTargetIndexForSize(index)
      if (!acc[targetIndex]) acc[targetIndex] = []
      acc[targetIndex].push(data)
      return acc
    }, [])
  }
export const partitionTxnPayload = (data: TxnData): Array<TxnData> => {
  if (!data.length) return []
  if (data.length <= MAX_PAYLOAD) return [data]
  return toPartitions(MAX_PAYLOAD)(data)
}
