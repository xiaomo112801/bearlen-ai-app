import type { ReturnSortScanData, SignInData } from '@/types/bearlen'
import alovaInstance from '../core/instance'

/** POST /api/sign */
export function apiSign(data: { account?: string; mobile?: string; password: string }) {
  return alovaInstance.Post<SignInData>('/sign', data)
}

/** POST /api/loginOut */
export function apiLoginOut() {
  return alovaInstance.Post<unknown>('/loginOut', {})
}

/** POST /api/returnSortScan */
export function apiReturnSortScan(data: { waybill_no: string }) {
  return alovaInstance.Post<ReturnSortScanData>('/returnSortScan', data)
}

/** GET /api/returnSortDetail */
export function apiReturnSortDetail(params: { problem_record_id?: number; waybill_no?: string }) {
  return alovaInstance.Get<Record<string, unknown>>('/returnSortDetail', { params })
}

/** POST /api/returnSortConfirmGoods */
export function apiReturnSortConfirmGoods(data: {
  problem_record_id: number
  order_goods_id?: number
  goods_code?: string
  confirmed_qty?: number
  confirmedQty?: number
  remark?: string
  media_urls?: Array<{ url: string; type?: 'image' | 'video' } | string> | string
  mediaUrls?: Array<{ url: string; type?: 'image' | 'video' } | string> | string
}) {
  return alovaInstance.Post<unknown>('/returnSortConfirmGoods', data)
}

/** POST /api/returnSortGoodsAbnormal */
export function apiReturnSortGoodsAbnormal(data: {
  problem_record_id: number
  order_goods_id?: number
  goods_code?: string
  remark?: string
  media_urls?: Array<{ url: string; type?: 'image' | 'video' } | string> | string
  mediaUrls?: Array<{ url: string; type?: 'image' | 'video' } | string> | string
}) {
  return alovaInstance.Post<unknown>('/returnSortGoodsAbnormal', data)
}

/** POST /api/returnSortConfirmWhole */
export function apiReturnSortConfirmWhole(data: { problem_record_id: number; remark?: string }) {
  return alovaInstance.Post<unknown>('/returnSortConfirmWhole', data)
}

/** POST /api/returnSortCloseOrder */
export function apiReturnSortCloseOrder(data: {
  problem_record_id: number
  close_type: 'damaged' | 'missing'
  remark?: string
}) {
  return alovaInstance.Post<unknown>('/returnSortCloseOrder', data)
}

/** GET /api/verify（可选） */
export function apiVerify() {
  return alovaInstance.Get<{ verifyCode?: string }>('/verify')
}
