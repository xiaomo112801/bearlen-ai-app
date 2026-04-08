<script setup lang="ts">
import { apiReturnSortConfirmGoods, apiReturnSortDetail } from '@/api/modules/bearlen'
import { getMultipartUploadAuthHeaders, getPersistedBearerToken } from '@/utils/authStorage'

definePage({
  name: 'returnSortGoodsDetail',
  layout: 'default',
  style: {
    navigationBarTitleText: '货品明细',
  },
})

const route = useRoute()
const toast = useGlobalToast()
const loading = useGlobalLoading()

type GoodsRow = Record<string, unknown>

const detailData = ref<Record<string, unknown> | null>(null)
const rowData = ref<GoodsRow | null>(null)
const problemRecordId = ref<number | null>(null)
const pageOptions = ref<Record<string, string>>({})
const confirmedQty = ref<string>('')
const remark = ref('')
const mediaItems = ref<Array<{ url: string, type: 'image' | 'video' }>>([])

function asText(v: unknown): string {
  if (typeof v === 'string')
    return v.trim()
  if (typeof v === 'number' && Number.isFinite(v))
    return String(v)
  return ''
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v))
    return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function unwrapData<T>(raw: T | { data?: T } | null | undefined): T | null {
  if (!raw || typeof raw !== 'object')
    return null
  const maybe = raw as { data?: T }
  if (maybe.data && typeof maybe.data === 'object')
    return maybe.data
  return raw as T
}

function findRow(goods: GoodsRow[], goodsId: number | null, goodsCode: string): GoodsRow | null {
  if (goodsId != null) {
    const byId = goods.find(r => asNumber(r.id ?? r.orderGoodsId ?? r.order_goods_id) === goodsId)
    if (byId)
      return byId
  }
  if (goodsCode) {
    const byCode = goods.find(r => asText(r.goodsCode ?? r.goods_code) === goodsCode)
    if (byCode)
      return byCode
  }
  return goods[0] ?? null
}

const titleText = computed(() => {
  const row = rowData.value
  if (!row)
    return '-'
  const name = asText(row.goodsName ?? row.goods_name ?? row.name ?? row.item_name ?? row.product_name ?? row.title)
  const code = asText(row.goodsCode ?? row.goods_code ?? row.sku ?? row.barcode ?? row.code)
  if (name && code)
    return `${name} (${code})`
  return name || code || '未命名货品'
})

const progressText = computed(() => {
  const row = rowData.value
  if (!row)
    return '-'
  const confirmed = asText(row.confirmedQty ?? row.confirmed_qty ?? row.confirmed ?? row.confirm_count)
  const required = asText(row.quantity ?? row.need_confirm_qty ?? row.required_qty ?? row.total_qty ?? row.qty)
  if (confirmed && required)
    return `${confirmed}/${required}`
  return confirmed || '-'
})

const maxQty = computed(() => {
  const row = rowData.value
  if (!row)
    return 0
  return asNumber(row.quantity ?? row.required_qty ?? row.total_qty ?? row.qty) ?? 0
})

const currentConfirmedQty = computed(() => {
  const row = rowData.value
  if (!row)
    return 0
  return asNumber(row.confirmedQty ?? row.confirmed_qty ?? row.confirmed ?? row.confirm_count) ?? 0
})

const canSaveAbnormalOnly = computed(() => !!remark.value.trim() || mediaItems.value.length > 0)

function normalizeMedia(items: unknown): Array<{ url: string, type: 'image' | 'video' }> {
  if (!Array.isArray(items))
    return []
  return items
    .map((it) => {
      if (typeof it === 'string')
        return { url: it, type: it.match(/\.(mp4|mov|webm|m4v|avi)(\?|$)/i) ? 'video' : 'image' as 'image' | 'video' }
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>
        const url = asText(o.url)
        const t = asText(o.type).toLowerCase() === 'video' ? 'video' : 'image'
        if (url)
          return { url, type: t }
      }
      return null
    })
    .filter(Boolean) as Array<{ url: string, type: 'image' | 'video' }>
}

function buildUploadUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}/upload/abnormalMedia`
}

/** 解析上传接口返回，兼容 { code, data: { items } } / data 直接为 items 等 */
function parseUploadItemsFromResponse(raw: string): Array<{ url: string, type: 'image' | 'video' }> {
  let parsed: Record<string, unknown> | null = null
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  }
  catch {
    return []
  }
  if (!parsed || typeof parsed !== 'object')
    return []

  const code = parsed.code
  if (typeof code === 'number' && code !== 1)
    return []

  const payload = parsed.data
  let items: unknown[] = []
  if (payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items))
    items = (payload as { items: unknown[] }).items
  else if (Array.isArray(payload))
    items = payload
  else if (Array.isArray((parsed as Record<string, unknown>).items))
    items = (parsed as { items: unknown[] }).items

  const out: Array<{ url: string, type: 'image' | 'video' }> = []
  for (const item of items) {
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const url = asText(o.url)
      if (!url)
        continue
      const type = asText(o.type).toLowerCase() === 'video' ? 'video' : 'image'
      out.push({ url, type })
    }
    else if (typeof item === 'string' && item) {
      out.push({ url: item, type: item.match(/\.(mp4|mov|webm|m4v|avi)(\?|$)/i) ? 'video' : 'image' })
    }
  }
  return out
}

async function loadDetail() {
  const q = {
    ...(route.query as Record<string, string | undefined>),
    ...pageOptions.value,
  }
  const pid = asNumber(q.problemRecordId)
  const w = asText(q.waybillNo)
  const goodsId = asNumber(q.goodsId)
  const goodsCode = asText(q.goodsCode)

  problemRecordId.value = pid
  if (!pid && !w) {
    toast.warning('缺少查询参数')
    return
  }

  const params: { problem_record_id?: number, waybill_no?: string } = {}
  if (pid != null)
    params.problem_record_id = pid
  else
    params.waybill_no = w

  loading.loading({ msg: '加载中…' })
  try {
    const data = await apiReturnSortDetail(params).send() as Record<string, unknown>
    const normalized = (unwrapData<Record<string, unknown>>(data) ?? data) as Record<string, unknown>
    detailData.value = normalized
    const goods = Array.isArray(normalized.goods) ? normalized.goods as GoodsRow[] : []
    rowData.value = findRow(goods, goodsId, goodsCode)
    if (!rowData.value)
      toast.warning('未匹配到货品明细')
    if (rowData.value) {
      confirmedQty.value = String(currentConfirmedQty.value || '')
      remark.value = asText(rowData.value.abnormalRemark ?? rowData.value.abnormal_remark)
      mediaItems.value = normalizeMedia(rowData.value.abnormalMediaUrls ?? rowData.value.abnormal_media_urls)
    }
  }
  finally {
    loading.close()
  }
}

async function confirmCurrent() {
  const pid = problemRecordId.value
  const row = rowData.value
  if (pid == null || !row) {
    toast.warning('缺少确认参数')
    return
  }
  const body: {
    problem_record_id: number
    order_goods_id?: number
    goods_code?: string
    confirmed_qty?: number
    remark?: string
    media_urls?: Array<{ url: string, type: 'image' | 'video' }>
  } = {
    problem_record_id: pid,
  }
  const ogid = asNumber(row.id ?? row.orderGoodsId ?? row.order_goods_id)
  const code = asText(row.goodsCode ?? row.goods_code)

  if (ogid != null) {
    body.order_goods_id = ogid
  }
  else if (code) {
    body.goods_code = code
  }
  else {
    toast.warning('缺少货品标识')
    return
  }

  const qtyText = confirmedQty.value.trim()
  if (qtyText) {
    const qty = Number(qtyText)
    if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
      toast.warning('确认数量需为非负整数')
      return
    }
    if (maxQty.value > 0 && qty > maxQty.value) {
      toast.warning(`确认数量不能超过 ${maxQty.value}`)
      return
    }
    body.confirmed_qty = qty
  }
  const r = remark.value.trim()
  if (r)
    body.remark = r
  if (mediaItems.value.length)
    body.media_urls = mediaItems.value

  loading.loading({ msg: '提交中…' })
  try {
    await apiReturnSortConfirmGoods(body).send()
    toast.success('已保存并确认')
    await loadDetail()
  }
  finally {
    loading.close()
  }
}

async function saveAbnormalOnly() {
  const pid = problemRecordId.value
  const row = rowData.value
  if (pid == null || !row) {
    toast.warning('缺少保存参数')
    return
  }
  if (!canSaveAbnormalOnly.value) {
    toast.warning('请填写备注或上传媒体')
    return
  }
  const body: {
    problem_record_id: number
    order_goods_id?: number
    goods_code?: string
    remark?: string
    media_urls?: Array<{ url: string, type: 'image' | 'video' }>
    confirmed_qty?: number
  } = {
    problem_record_id: pid,
    confirmed_qty: currentConfirmedQty.value,
  }
  const ogid = asNumber(row.id ?? row.orderGoodsId ?? row.order_goods_id)
  const code = asText(row.goodsCode ?? row.goods_code)
  if (ogid != null)
    body.order_goods_id = ogid
  else if (code)
    body.goods_code = code
  body.remark = remark.value.trim()
  body.media_urls = mediaItems.value

  loading.loading({ msg: '保存中…' })
  try {
    await apiReturnSortConfirmGoods(body).send()
    toast.success('异常信息已保存')
    await loadDetail()
  }
  finally {
    loading.close()
  }
}

async function pickLocalMediaPaths(): Promise<string[]> {
  const tapIndex = await new Promise<number>((resolve, reject) => {
    uni.showActionSheet({
      itemList: ['选择图片', '选择视频'],
      success: res => resolve(res.tapIndex),
      fail: reject,
    })
  }).catch(() => -1)

  if (tapIndex < 0)
    return []

  if (tapIndex === 0) {
    const r = await new Promise<{ tempFilePaths?: string | string[] }>((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: res => resolve(res),
        fail: reject,
      })
    })
    const list = r.tempFilePaths
    if (Array.isArray(list))
      return list
    return list ? [list] : []
  }

  const r = await new Promise<{ tempFilePath?: string }>((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 120,
      camera: 'back',
      success: resolve,
      fail: reject,
    })
  })
  return r.tempFilePath ? [r.tempFilePath] : []
}

async function pickAndUploadMedia() {
  let paths: string[] = []
  try {
    paths = await pickLocalMediaPaths()
  }
  catch {
    return
  }
  if (!paths.length)
    return

  if (!getPersistedBearerToken()) {
    toast.warning('请先登录后再上传')
    return
  }

  try {
    loading.loading({ msg: '上传中…' })
    const uploadUrl = buildUploadUrl()
    const uploaded: Array<{ url: string, type: 'image' | 'video' }> = []
    const uploadHeader = getMultipartUploadAuthHeaders()

    for (const filePath of paths) {
      if (!filePath)
        continue
      const res = await uni.uploadFile({
        url: uploadUrl,
        filePath,
        name: 'file',
        header: uploadHeader,
      })
      const sc = (res as { statusCode?: number }).statusCode
      if (sc != null && sc !== 200) {
        toast.warning(`上传失败 (${sc})`)
        continue
      }
      const raw = typeof res.data === 'string' ? res.data : String(res.data ?? '')
      const items = parseUploadItemsFromResponse(raw)
      uploaded.push(...items)
    }
    if (uploaded.length) {
      mediaItems.value = [...mediaItems.value, ...uploaded]
      toast.success(`已上传 ${uploaded.length} 个文件`)
    }
    else {
      toast.warning('上传失败或无可用文件')
    }
  }
  finally {
    loading.close()
  }
}

function removeMedia(index: number) {
  mediaItems.value.splice(index, 1)
}

onShow(() => {
  loadDetail()
})

onLoad((query?: Record<string, unknown>) => {
  pageOptions.value = (query || {}) as Record<string, string>
})
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-3 py-3 pb-8 dark:bg-[var(--wot-dark-background)]">
    <view class="mb-3 rounded-3 bg-white p-4 dark:bg-[var(--wot-dark-background2)]">
      <text class="mb-3 block text-4.2 text-gray-800 font-semibold dark:text-[var(--wot-dark-color)]">
        {{ titleText }}
      </text>
      <wd-cell-group border>
        <wd-cell title="确认进度" :value="progressText" />
        <wd-cell title="数量" :value="asText(rowData?.quantity ?? '-') || '-'" />
        <wd-cell title="货品编码" :value="asText(rowData?.goodsCode ?? rowData?.goods_code ?? '-')" />
      </wd-cell-group>
      <wd-gap :height="12" />
      <wd-input
        v-model="confirmedQty"
        type="number"
        label="确认数量"
        placeholder="不填则 +1，填 0 可取消确认"
        custom-class="detail-confirm-qty-input"
      />
      <wd-gap :height="10" />
      <wd-textarea
        v-model="remark"
        placeholder="请输入异常备注（选填）"
        :maxlength="200"
        show-count
      />
      <wd-gap :height="10" />
      <wd-button size="small" plain :round="false" @click="pickAndUploadMedia">
        上传照片/视频
      </wd-button>
      <view v-if="mediaItems.length" class="mt-2 flex flex-col gap-2">
        <view
          v-for="(m, idx) in mediaItems"
          :key="`${m.url}-${idx}`"
          class="flex items-center justify-between rounded-2 bg-gray-100 px-3 py-2 dark:bg-[var(--wot-dark-background3)]"
        >
          <text class="max-w-[70%] truncate text-3 text-gray-600 dark:text-[var(--wot-dark-color2)]">
            {{ m.type === 'video' ? '[视频]' : '[图片]' }} {{ m.url }}
          </text>
          <wd-button size="small" type="error" plain :round="false" @click="removeMedia(idx)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <view class="flex flex-col gap-2">
      <wd-button type="primary" block :round="false" @click="confirmCurrent">
        确认此货品
      </wd-button>
      <wd-button :round="false" plain block @click="saveAbnormalOnly">
        仅保存异常备注/媒体
      </wd-button>
    </view>
  </view>
</template>

<style scoped>
.detail-confirm-qty-input :deep(.wd-input__body) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.detail-confirm-qty-input :deep(.wd-input__inner) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.detail-confirm-qty-input :deep(input) {
  text-align: right;
}
</style>
