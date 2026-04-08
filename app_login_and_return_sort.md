# App / 移动端：登录与退件整理接口

本文档描述 **API 应用**（路径前缀 **`/api`**）下的 **登录**、**验证码**、**退出** 以及 **退件整理** 接口，与后台 **`/admin`** 中退件整理业务一致（见 `app/service/ReturnSortService.php`）。

---

## 1. 通用说明

### 1.1 基础地址

- 示例：`https://{域名}/api`
- 下文路径均省略域名，以 **`/api`** 为前缀（与多应用入口一致；若实际部署带 `index.php` 等，请按环境拼接）。

### 1.2 跨域（CORS）

相关路由已配置 `Access-Control-Allow-Origin: *`（以 `app/api/route/route.php` 为准）。

### 1.3 响应格式（JSON）

成功：

```json
{
  "code": 1,
  "message": "提示文案",
  "data": {}
}
```

失败：

```json
{
  "code": -1,
  "message": "错误说明",
  "data": []
}
```

说明：

- `code === 1` 表示业务成功。
- 成功时 `data` 内对象字段可能被转为 **驼峰**（项目 `success()` 中的 `convertKeysToCamel`）。
- 失败时 HTTP 状态码当前实现多为 **500**，请以 **`code`** 判断成功与否。

---

## 2. 登录相关（无需 JWT）

### 2.1 登录

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/sign` |
| **Content-Type** | `application/x-www-form-urlencoded` 或 `application/json`（与现有 ThinkPHP `input('post.xxx')` 一致） |
| **限流** | 5 次/分钟 |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 条件 | 用户名或手机号；与 `mobile` 二选一，至少填一个 |
| mobile | string | 条件 | 兼容旧版：含义同 `account`，仅当 `account` 为空时生效 |
| password | string | 是 | 明文密码（生产环境校验长度 8–16，见 `validate` 场景 `sign`） |

#### 非生产 / 调试（`APP_DEBUG=true`）

- 仅校验「账号非空」且用户存在（用户名或手机号匹配），**不校验密码**。

#### 成功响应 `data` 示例

```json
{
  "token": "Bearer eyJ...",
  "failureTime": 1735689600,
  "account": "昵称或用户名",
  "avatar": "",
  "uid": 1
}
```

同时响应头可能包含 **`Authorization: Bearer <token>`**（与后台 `/admin/sign` 一致）。

#### 与旧版兼容说明

若旧客户端把 **`data` 当作整段字符串**（仅 token），请改为使用 **`data.token`**（或解析对象字段）；当前结构已与后台登录对齐。

---

### 2.2 图形验证码（可选）

| 项目 | 说明 |
|------|------|
| **Method** | `GET` |
| **Path** | `/api/verify` |
| **限流** | 10 次/分钟 |

#### 成功响应 `data`

```json
{
  "verifyCode": "<base64 图片数据或 Captcha 生成结果>"
}
```

说明：当前登录接口校验场景 **`sign`** 不要求验证码；若后续接入图形验证码，需与前端、校验器联调。

---

### 2.3 退出登录

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/loginOut` |
| **鉴权** | 请求头携带 **`Authorization: Bearer <token>`**（与 `UserLogic::logout()` 内 `JWTAuth::auth()` 一致） |

成功：业务 `code=1`；服务端会将当前 token 作废（黑名单机制以 JWT 扩展配置为准）。

---

## 3. 退件整理（需登录）

以下接口均在 **JWT + Auth** 中间件组内：**必须先登录**，在请求头携带 Token。

**Auth 说明**：仅 **`api` 应用** 下控制器 **`ReturnSort`** 不校验 RBAC 权限码，**仅登录即可**；后台 `/admin/returnSort*` 仍按角色权限配置。

### 3.1 鉴权请求头

| Header | 值 |
|--------|-----|
| Authorization | `Bearer <token>` |
| 或 Token | 与项目约定一致（见 `JWT` 中间件） |

---

### 3.2 扫描运单号（写入/更新列表）

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/returnSortScan` |

#### Body（JSON 或表单）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| waybill_no | string | 是 | 运单号 |

#### 成功 `data` 结构

与后台一致，包含：

- `problem_record`：问题件记录（`scene=return_sort`）
- `order`：匹配到的订单；无订单时为 `null`
- `goods`：订单明细行，带确认进度字段（如 `confirmed`、`confirmed_qty`）

业务逻辑见：[后台退件整理说明](../admin/return_sort_api.md) 第一节。

---

### 3.3 查询退件整理详情

| 项目 | 说明 |
|------|------|
| **Method** | `GET` |
| **Path** | `/api/returnSortDetail` |

#### Query（二选一）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| problem_record_id | int | 条件 | 问题件记录 ID |
| waybill_no | string | 条件 | 运单号 |

---

### 3.4 逐条确认货品

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/returnSortConfirmGoods` |

#### Body

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| problem_record_id | int | 是 | 问题件记录 ID |
| order_goods_id | int | 条件 | 与 `goods_code` 二选一 |
| goods_code | string | 条件 | 货品编码（与订单行 `goods_code` 匹配） |
| confirmed_qty | int | 否 | 手动指定该行确认数量；也可传 `confirmedQty`（驼峰） |
| confirmedQty | int | 否 | 同 `confirmed_qty` |
| remark | string | 否 | 该行货品**异常备注**（与 `media_urls` 二选一或同时传；键存在则覆盖写入） |
| media_urls | array / string | 否 | 异常照片/视频列表，见下文；也可传 `mediaUrls`（驼峰） |

**确认数量规则：**

- **不传 `confirmed_qty` / `confirmedQty`**：每请求一次，该行确认数 **+1**（不超过该行订单数量）。
- **传整数**：将该行确认数 **设为该值**（范围 `0`～该行订单数量 `quantity`）；传 **`0`** 表示取消该行确认（清空该行确认记录）。

**异常备注与媒体：**

- 可先调用 **`POST /api/upload/abnormalMedia`** 上传文件，将返回的 `{ url, type }` 填入 `media_urls`。
- `media_urls` 支持 JSON 数组字符串或数组，元素为 **`{ "url": "https://...", "type": "image"|"video" }`**，或仅 URL 字符串（后端会按扩展名推断 `type`）。
- 若请求中带 `remark` 或 `media_urls` 键，会在本行确认记录上**保存/覆盖**对应字段（与是否改数量无关）。

详情接口 `returnSortDetail` 返回的每条 `goods` 中会多出 **`abnormalRemark`**、**`abnormalMediaUrls`**（驼峰）字段。

全部货品确认后，记录将自动标记为已完成（`processed`）。

---

### 3.4.1 上传异常照片或视频（需登录）

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/upload/abnormalMedia` |
| **Content-Type** | `multipart/form-data` |
| **鉴权** | **必填** `Authorization: Bearer <token>`（与 `upload/images` 相同，走 JWT+Auth） |

支持扩展名（与后端校验一致）：常见图片及 `mp4`、`mov`、`webm`、`m4v`、`avi` 等；单文件最大约 **100MB**（`fileSize:102400` 按 ThinkPHP 规则，以实际为准）。

成功 `data` 示例：

```json
{
  "items": [
    { "url": "https://example.com/storage/...", "type": "image" },
    { "url": "https://example.com/storage/...", "type": "video" }
  ]
}
```

将 `items` 作为 `media_urls` 提交到逐条确认或「仅异常信息」接口即可。

---

### 3.4.2 仅保存货品异常备注/媒体（不改确认数量）

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/returnSortGoodsAbnormal` |
| **鉴权** | 需登录（JWT） |

#### Body

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| problem_record_id | int | 是 | 问题件记录 ID |
| order_goods_id | int | 条件 | 与 `goods_code` 二选一 |
| goods_code | string | 条件 | 货品编码 |
| remark | string | 条件 | 与 `media_urls` 至少其一（键存在即写入，可清空备注） |
| media_urls | array / string | 条件 | 同上 |

无确认行时会创建 **`confirmed_qty = 0`** 的记录，仅用于挂载异常信息；整单仍为「未完成」直至确认数量满足规则。

---

### 3.5 整单确认

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/returnSortConfirmWhole` |

#### Body

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| problem_record_id | int | 是 | 问题件记录 ID |
| remark | string | 否 | 备注 |

- **无系统订单**：可直接完成退件整理。
- **有订单**：一次性按订单内全部货品数量确认。

---

### 3.6 破损/缺失：关闭当前单

| 项目 | 说明 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/returnSortCloseOrder` |

#### Body

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| problem_record_id | int | 是 | 问题件记录 ID |
| close_type | string | 是 | 仅 `damaged`（破损）或 `missing`（缺失） |
| remark | string | 否 | 备注 |

---

## 4. 与后台接口对照

| 能力 | App（本文） | 后台 |
|------|-------------|------|
| 扫描 | `POST /api/returnSortScan` | `POST /admin/returnSortScan` |
| 详情 | `GET /api/returnSortDetail` | `GET /admin/returnSortDetail` |
| 逐条确认 | `POST /api/returnSortConfirmGoods` | `POST /admin/returnSortConfirmGoods` |
| 整单确认 | `POST /api/returnSortConfirmWhole` | `POST /admin/returnSortConfirmWhole` |
| 关单 | `POST /api/returnSortCloseOrder` | `POST /admin/returnSortCloseOrder` |
| 货品异常备注/媒体 | `POST /api/returnSortGoodsAbnormal` | `POST /admin/returnSortGoodsAbnormal` |
| 异常图/视频上传 | `POST /api/upload/abnormalMedia` | 同左（共用 API 应用） |

业务规则与字段说明见：**[后台退件整理说明](../admin/return_sort_api.md)**。

---

## 5. 路由与源码索引

| 说明 | 路径 |
|------|------|
| API 路由 | `app/api/route/route.php` |
| 登录控制器 | `app/api/controller/Login.php` |
| 退件控制器 | `app/api/controller/ReturnSort.php` |
| 共用业务 | `app/service/ReturnSortService.php` |
| 异常媒体上传 | `app/api/controller/UploadApi.php` → `abnormalMedia` |
| 上传实现 | `app/service/Upload.php` → `uploadReturnAbnormalMedia` |
