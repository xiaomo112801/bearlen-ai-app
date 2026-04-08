/**
 * App API（/api）业务类型，与 app_login_and_return_sort.md 对齐
 */

export interface ApiEnvelope<T = unknown> {
  code: number
  message?: string
  msg?: string
  data: T
}

/** POST /api/sign 成功 data */
export interface SignInData {
  token: string
  failureTime?: number
  account?: string
  avatar?: string
  uid?: number
}

export interface ProblemRecordBrief {
  id?: number
  problem_record_id?: number
  [key: string]: unknown
}

export interface ReturnSortScanData {
  problem_record?: ProblemRecordBrief | null
  order?: Record<string, unknown> | null
  goods?: Array<Record<string, unknown>>
  [key: string]: unknown
}
