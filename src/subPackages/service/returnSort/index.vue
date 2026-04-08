<script setup lang="ts">
import type { ReturnSortScanData } from '@/types/bearlen'
import {
  apiReturnSortCloseOrder,
  apiReturnSortConfirmGoods,
  apiReturnSortConfirmWhole,
  apiReturnSortDetail,
  apiReturnSortScan,
} from '@/api/modules/bearlen'

definePage({
  name: 'returnSort',
  layout: 'default',
  style: {
    navigationBarTitleText: '退件整理',
  },
})

const toast = useGlobalToast()
const message = useGlobalMessage()
const loading = useGlobalLoading()
const router = useRouter()

const waybillNo = ref('')
const goodsBarcode = ref('')
const scanData = ref<ReturnSortScanData | null>(null)
const detailData = ref<Record<string, unknown> | null>(null)
const rowQtyInput = ref<Record<string, string>>({})

function unwrapData<T>(raw: T | { data?: T } | null | undefined): T | null {
  if (!raw || typeof raw !== 'object')
    return null
  const maybe = raw as { data?: T }
  if (maybe.data && typeof maybe.data === 'object')
    return maybe.data
  return raw as T
}

function pickProblemRecordId(data: ReturnSortScanData | Record<string, unknown> | null | undefined): number | undefined {
  if (!data || typeof data !== 'object')
    return undefined
  const normalized = unwrapData<Record<string, unknown>>(data as Record<string, unknown>) ?? (data as Record<string, unknown>)
  const pr = normalized.problemRecord ?? normalized.problem_record
  if (!pr || typeof pr !== 'object')
    return undefined
  const o = pr as Record<string, unknown>
  const raw = o.problemRecordId ?? o.problem_record_id ?? o.id
  if (typeof raw === 'number')
    return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

const problemRecordId = computed(() => pickProblemRecordId(scanData.value) ?? pickProblemRecordId(detailData.value ?? undefined))

const hasProblemRecord = computed(() => {
  const d1 = unwrapData<Record<string, unknown>>(scanData.value as unknown as Record<string, unknown>)
  const d2 = unwrapData<Record<string, unknown>>(detailData.value)
  return !!(d1?.problemRecord || d1?.problem_record || d2?.problemRecord || d2?.problem_record)
})

const goodsList = computed(() => {
  const d1 = unwrapData<Record<string, unknown>>(detailData.value)
  const d2 = unwrapData<Record<string, unknown>>(scanData.value as unknown as Record<string, unknown>)
  const g = d1?.goods ?? d2?.goods
  return Array.isArray(g) ? g as Record<string, unknown>[] : []
})

const ownerInfo = computed(() => {
  const d1 = unwrapData<Record<string, unknown>>(detailData.value)
  const d2 = unwrapData<Record<string, unknown>>(scanData.value as unknown as Record<string, unknown>)
  const order = (d1?.order ?? d2?.order) as Record<string, unknown> | null | undefined
  if (!order || typeof order !== 'object')
    return ''
  const shop = asText(order.shopName ?? order.shop_name)
  const customerCode = asText(order.customerCode ?? order.customer_code)
  if (shop && customerCode)
    return `${shop} (${customerCode})`
  return shop || customerCode
})

function asText(v: unknown): string {
  if (typeof v === 'string')
    return v.trim()
  if (typeof v === 'number' && Number.isFinite(v))
    return String(v)
  return ''
}

function goodsDisplayTitle(row: Record<string, unknown>): string {
  const name = asText(row.goodsName ?? row.goods_name ?? row.name ?? row.item_name ?? row.product_name ?? row.title)
  const code = asText(row.goodsCode ?? row.goods_code ?? row.sku ?? row.barcode ?? row.code)

  if (name && code)
    return `${name} (${code})`
  if (name)
    return name
  if (code)
    return code
  return '未命名货品'
}

function goodsProgressLabel(row: Record<string, unknown>): string {
  const confirmed = asText(row.confirmedQty ?? row.confirmed_qty ?? row.confirmed ?? row.confirm_count)
  const required = asText(row.quantity ?? row.need_confirm_qty ?? row.required_qty ?? row.total_qty ?? row.qty)

  if (confirmed && required)
    return `确认进度 ${confirmed}/${required}`
  if (confirmed)
    return `确认进度 ${confirmed}`
  return '确认进度 -'
}

function buildGoodsIdentifyBody(row: Record<string, unknown>): { order_goods_id?: number, goods_code?: string } | null {
  const ogid = row.id ?? row.orderGoodsId ?? row.order_goods_id
  const code = row.goodsCode ?? row.goods_code
  if (typeof ogid === 'number')
    return { order_goods_id: ogid }
  if (typeof code === 'string' && code)
    return { goods_code: code }
  return null
}

function rowKey(row: Record<string, unknown>, idx: number): string {
  return String(row.order_goods_id ?? row.orderGoodsId ?? row.id ?? row.goods_code ?? row.goodsCode ?? row.sku ?? idx)
}

async function loadDetail() {
  const w = waybillNo.value.trim()
  const pid = problemRecordId.value
  const params: { problem_record_id?: number, waybill_no?: string } = {}
  if (pid)
    params.problem_record_id = pid
  else if (w)
    params.waybill_no = w
  else
    return
  const data = await apiReturnSortDetail(params).send() as Record<string, unknown>
  detailData.value = (unwrapData<Record<string, unknown>>(data) ?? data) as Record<string, unknown>
}

async function doScan() {
  const w = waybillNo.value.trim()
  if (!w) {
    toast.warning('请输入运单号')
    return
  }
  loading.loading({ msg: '提交扫描…' })
  try {
    const data = await apiReturnSortScan({ waybill_no: w }).send() as ReturnSortScanData | { data?: ReturnSortScanData }
    scanData.value = (unwrapData<ReturnSortScanData>(data) ?? data) as ReturnSortScanData
    await loadDetail()
  }
  finally {
    loading.close()
  }
}

function openGoodsDetail(row: Record<string, unknown>) {
  const pid = problemRecordId.value
  if (pid == null) {
    toast.warning('缺少问题件记录 ID')
    return
  }
  const id = row.id ?? row.orderGoodsId ?? row.order_goods_id
  const query: Record<string, string> = {
    problemRecordId: String(pid),
    waybillNo: waybillNo.value.trim(),
  }
  if (typeof id === 'number')
    query.goodsId = String(id)
  const code = asText(row.goodsCode ?? row.goods_code)
  if (code)
    query.goodsCode = code
  router.push({
    path: '/subPackages/service/returnSort/detail',
    query,
  })
}

async function quickConfirmRow(row: Record<string, unknown>, idx: number) {
  const pid = problemRecordId.value
  if (pid == null) {
    toast.warning('缺少问题件记录 ID')
    return
  }
  const identify = buildGoodsIdentifyBody(row)
  if (!identify) {
    toast.warning('缺少货品标识')
    return
  }
  const key = rowKey(row, idx)
  const qtyText = (rowQtyInput.value[key] || '').trim()
  let confirmedQty: number | undefined
  if (qtyText) {
    const n = Number(qtyText)
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      toast.warning('确认数量需为非负整数')
      return
    }
    const max = Number(row.quantity ?? row.required_qty ?? row.total_qty ?? row.qty)
    if (Number.isFinite(max) && max >= 0 && n > max) {
      toast.warning(`确认数量不能超过 ${max}`)
      return
    }
    confirmedQty = n
  }
  loading.loading({ msg: '确认中…' })
  try {
    await apiReturnSortConfirmGoods({
      problem_record_id: pid,
      ...(confirmedQty != null ? { confirmed_qty: confirmedQty } : {}),
      ...identify,
    }).send()
    toast.success(confirmedQty != null ? '确认数量已保存' : '已确认 +1')
    await loadDetail()
  }
  finally {
    loading.close()
  }
}

async function scanWaybillByCamera() {
  try {
    const res = await uni.scanCode({ onlyFromCamera: true })
    const result = String(res.result || '').trim()
    if (!result) {
      toast.warning('未识别到运单号')
      return
    }
    waybillNo.value = result
    toast.success('已识别运单号')
  }
  catch {
    // 用户取消扫码时静默处理
  }
}

async function scanGoodsBarcodeByCamera() {
  try {
    const res = await uni.scanCode({ onlyFromCamera: true })
    const result = String(res.result || '').trim()
    if (!result) {
      toast.warning('未识别到商品条码')
      return
    }
    goodsBarcode.value = result
  }
  catch {
    // 用户取消扫码时静默处理
  }
}

onShow(() => {
  if (waybillNo.value.trim() || problemRecordId.value != null)
    loadDetail()
})

function confirmWhole() {
  const pid = problemRecordId.value
  if (pid == null) {
    toast.warning('缺少问题件记录 ID')
    return
  }
  message.confirm({
    title: '整单确认',
    msg: '将按订单内全部货品数量一次性确认，是否继续？',
    success: async () => {
      loading.loading({ msg: '提交中…' })
      try {
        await apiReturnSortConfirmWhole({ problem_record_id: pid }).send()
        toast.success('已整单确认')
        await loadDetail()
      }
      finally {
        loading.close()
      }
    },
  })
}

function closeOrder(closeType: 'damaged' | 'missing') {
  const pid = problemRecordId.value
  if (pid == null) {
    toast.warning('缺少问题件记录 ID')
    return
  }
  message.confirm({
    title: closeType === 'damaged' ? '破损关单' : '缺失关单',
    msg: '确认关闭当前退件单？',
    success: async () => {
      loading.loading({ msg: '提交中…' })
      try {
        await apiReturnSortCloseOrder({ problem_record_id: pid, close_type: closeType }).send()
        toast.success('已关单')
        await loadDetail()
      }
      finally {
        loading.close()
      }
    },
  })
}
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-3 py-3 pb-8 dark:bg-[var(--wot-dark-background)]">
    <view class="mb-3 rounded-3 bg-white p-4 dark:bg-[var(--wot-dark-background2)]">
      <text class="mb-3 block text-3.5 text-gray-600 dark:text-[var(--wot-dark-color2)]">
        扫描运单号写入/更新列表（需登录）
      </text>
      <view class="flex items-center gap-2">
        <wd-input v-model="waybillNo" placeholder="请输入或扫描运单号" clearable custom-class="flex-1!" />
        <wd-button size="small" plain :round="false" @click="scanWaybillByCamera">
          扫码
        </wd-button>
      </view>
      <wd-gap :height="12" />
      <wd-button type="primary" block :round="false" @click="doScan">
        扫描提交
      </wd-button>
    </view>

    <view v-if="scanData || detailData" class="mb-3 rounded-3 bg-white p-4 dark:bg-[var(--wot-dark-background2)]">
      <text class="mb-2 block text-4 text-gray-800 font-semibold dark:text-[var(--wot-dark-color)]">
        扫描商品条码
      </text>
      <view class="mb-2 flex items-center gap-2">
        <wd-input v-model="goodsBarcode" placeholder="请输入或扫描商品条码" clearable custom-class="flex-1!" />
        <wd-button size="small" plain :round="false" @click="scanGoodsBarcodeByCamera">
          扫码
        </wd-button>
      </view>
      <text class="block break-all text-3 text-gray-500 dark:text-[var(--wot-dark-color2)]">
        问题件：{{ hasProblemRecord ? '已关联' : '无' }}
        <template v-if="problemRecordId != null">
          · ID {{ problemRecordId }}
        </template>
      </text>
    </view>

    <view v-if="goodsList.length" class="mb-3 rounded-3 bg-white p-4 dark:bg-[var(--wot-dark-background2)]">
      <view class="mb-3 flex items-center justify-between">
        <text class="block text-4 text-gray-800 font-semibold dark:text-[var(--wot-dark-color)]">
          货品明细
        </text>
        <text v-if="ownerInfo" class="max-w-[62%] truncate text-right text-3 text-gray-500 dark:text-[var(--wot-dark-color2)]">
          货主：{{ ownerInfo }}
        </text>
      </view>
      <wd-cell-group border>
        <wd-cell
          v-for="(row, idx) in goodsList"
          :key="rowKey(row, idx)"
          :title="goodsDisplayTitle(row)"
          :label="goodsProgressLabel(row)"
          is-link
          @click="openGoodsDetail(row)"
        >
          <template #default>
            <view class="qty-action" @click.stop>
              <input
                v-model="rowQtyInput[rowKey(row, idx)]"
                class="qty-input"
                type="number"
                placeholder="数量"
                placeholder-class="qty-placeholder"
              >
              <view class="qty-btn-wrap">
                <wd-button block size="small" type="primary" :round="false" @click.stop="quickConfirmRow(row, idx)">
                  确认
                </wd-button>
              </view>
            </view>
          </template>
        </wd-cell>
      </wd-cell-group>
      <wd-gap :height="8" />
      <text class="text-3 text-gray-400 dark:text-gray-500">
        点击一行进入明细详情，再执行确认
      </text>
    </view>

    <view v-if="problemRecordId != null" class="flex flex-col gap-2">
      <wd-button type="success" block :round="false" @click="confirmWhole">
        整单确认
      </wd-button>
      <wd-button type="warning" block :round="false" @click="closeOrder('damaged')">
        破损关单
      </wd-button>
      <wd-button type="error" block :round="false" @click="closeOrder('missing')">
        缺失关单
      </wd-button>
    </view>

    <view v-if="detailData && !goodsList.length" class="mt-3 rounded-3 bg-white p-4 dark:bg-[var(--wot-dark-background2)]">
      <text class="text-3.5 text-gray-500 dark:text-[var(--wot-dark-color2)]">
        详情已加载，当前无货品行或结构待后端返回。
      </text>
    </view>
  </view>
</template>

<style scoped>
.qty-action {
  width: 136rpx;
  margin-left: auto;
  margin-right: 14rpx;
}

.qty-input {
  width: 100%;
  height: 62rpx;
  border: 1px solid #d5d9e0;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #374151;
  text-align: center;
  background: #fff;
  box-sizing: border-box;
}

.qty-placeholder {
  color: #9ca3af;
  font-size: 22rpx;
}

.qty-btn-wrap {
  margin-top: 25rpx;
}

.qty-action :deep(.wd-button) {
  height: 62rpx;
  font-size: 24rpx;
  padding: 0;
}
</style>
