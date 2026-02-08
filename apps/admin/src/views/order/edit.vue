<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getOrderDetailApi,
  getProductListApi,
  getProductSkuListApi,
  getUserListApi,
  saveOrderApi,
  updateOrderApi,
} from '#/api';

const route = useRoute();
const router = useRouter();

const orderId = computed(() => (route.query.id ? Number(route.query.id) : undefined));
const isEdit = computed(() => !!orderId.value);

const loading = ref(false);
const saving = ref(false);

type OrderItemRow = { productId?: number; skuId?: number; quantity: number };

const formSave = ref<{
  orderNo: string;
  userId: number | undefined;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: OrderApi.OrderStatus;
  orderItems: OrderItemRow[];
}>({
  orderNo: '',
  userId: undefined,
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  status: 'PENDING_PAYMENT',
  orderItems: [{ productId: undefined, skuId: undefined, quantity: 1 }],
});

const formUpdate = ref<{
  id: number;
  orderNo: string;
  userId: number;
  totalAmount: number | undefined;
  status: OrderApi.OrderStatus | undefined;
}>({
  id: 0,
  orderNo: '',
  userId: 0,
  totalAmount: undefined,
  status: undefined,
});

const userOptions = ref<{ value: number; label: string }[]>([]);
const productOptions = ref<{ value: number; label: string }[]>([]);
const skuOptionsCache = ref<Record<number, { value: number; label: string }[]>>({});

async function loadUsers() {
  try {
    const res = await getUserListApi({ current: 1, size: 500 });
    userOptions.value = (res.records || []).map((u) => ({
      value: u.id,
      label: (u as { realName?: string }).realName || String(u.id),
    }));
  } catch (e) {
    ElMessage.error('加载用户列表失败');
  }
}

async function loadProducts() {
  try {
    const res = await getProductListApi({ current: 1, size: 200 });
    productOptions.value = (res.records || []).map((p) => ({ value: p.id, label: p.name }));
  } catch (e) {
    ElMessage.error('加载商品列表失败');
  }
}

async function loadSkus(productId: number) {
  if (skuOptionsCache.value[productId]) return;
  try {
    const res = await getProductSkuListApi({ productId, current: 1, size: 100 });
    const list = res.records || [];
    const opts = list.map((s) => ({
      value: s.id,
      label: `${s.skuCode}${s.specJson ? ' ' + JSON.stringify(s.specJson) : ''}`.trim(),
    }));
    skuOptionsCache.value = { ...skuOptionsCache.value, [productId]: opts };
  } catch (e) {
    ElMessage.error('加载SKU列表失败');
  }
}

function getSkuOptions(productId: number | undefined) {
  if (!productId) return [];
  return skuOptionsCache.value[productId] || [];
}

async function onProductChange(row: OrderItemRow, v: number | undefined) {
  row.skuId = undefined;
  if (v) await loadSkus(v);
}

function addOrderItem() {
  formSave.value.orderItems.push({ productId: undefined, skuId: undefined, quantity: 1 });
}

function removeOrderItem(i: number) {
  formSave.value.orderItems.splice(i, 1);
}

async function fetchDetail() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    const d = await getOrderDetailApi(orderId.value);
    formUpdate.value = {
      id: d.id,
      orderNo: d.orderNo || '',
      userId: d.userId,
      totalAmount: d.totalAmount,
      status: d.status,
    };
  } catch (e) {
    ElMessage.error('获取订单失败');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadUsers();
  await loadProducts();
  if (isEdit.value && orderId.value) await fetchDetail();
});

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value && orderId.value) {
      await updateOrderApi({
        id: formUpdate.value.id,
        userId: formUpdate.value.userId,
        orderNo: formUpdate.value.orderNo || undefined,
        totalAmount: formUpdate.value.totalAmount,
        status: formUpdate.value.status,
      });
      ElMessage.success('更新成功');
    } else {
      const items = formSave.value.orderItems
        .filter((x) => x.skuId != null && x.quantity > 0)
        .map((x) => ({ skuId: x.skuId!, quantity: x.quantity }));
      if (items.length === 0) {
        ElMessage.warning('请至少添加一条订单明细');
        saving.value = false;
        return;
      }
      if (!formSave.value.userId) {
        ElMessage.warning('请选择用户');
        saving.value = false;
        return;
      }
      if (!formSave.value.receiverName?.trim()) {
        ElMessage.warning('请输入收货人');
        saving.value = false;
        return;
      }
      if (!formSave.value.receiverPhone?.trim()) {
        ElMessage.warning('请输入手机号');
        saving.value = false;
        return;
      }
      if (!formSave.value.receiverAddress?.trim()) {
        ElMessage.warning('请输入收货地址');
        saving.value = false;
        return;
      }
      await saveOrderApi({
        orderNo: formSave.value.orderNo || undefined,
        userId: formSave.value.userId,
        receiverName: formSave.value.receiverName.trim(),
        receiverPhone: formSave.value.receiverPhone.trim(),
        receiverAddress: formSave.value.receiverAddress.trim(),
        status: formSave.value.status,
        orderItems: items,
      });
      ElMessage.success('创建成功');
    }
    router.push('/order');
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.back();
}

const STATUS_OPTIONS = [
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '完成', value: 'COMPLETED' },
  { label: '取消', value: 'CANCELLED' },
];
</script>

<template>
  <div class="order-edit">
    <div class="order-edit-header">
      <h2>{{ isEdit ? '编辑订单' : '新增订单' }}</h2>
      <div class="order-edit-actions">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">
          保存
        </ElButton>
      </div>
    </div>

    <div v-loading="loading" class="order-edit-content">
      <!-- 编辑 -->
      <ElForm v-if="isEdit" label-width="100px" class="order-edit-form">
        <ElFormItem label="订单号">
          <ElInput v-model="formUpdate.orderNo" placeholder="订单号" />
        </ElFormItem>
        <ElFormItem label="用户" required>
          <ElSelect
            v-model="formUpdate.userId"
            placeholder="请选择用户"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in userOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="总金额">
          <ElInputNumber
            v-model="formUpdate.totalAmount"
            :min="0.01"
            :precision="2"
            placeholder="选填"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="formUpdate.status" placeholder="状态" clearable style="width: 100%">
            <ElOption
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <!-- 新增 -->
      <ElForm v-else label-width="100px" class="order-edit-form">
        <ElFormItem label="订单号">
          <ElInput v-model="formSave.orderNo" placeholder="选填，为空时后端生成" />
        </ElFormItem>
        <ElFormItem label="用户" required>
          <ElSelect
            v-model="formSave.userId"
            placeholder="请选择用户"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in userOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="收货人" required>
          <ElInput
            v-model="formSave.receiverName"
            placeholder="收货人"
            maxlength="64"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="手机号" required>
          <ElInput
            v-model="formSave.receiverPhone"
            placeholder="手机号"
            maxlength="20"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="收货地址" required>
          <ElInput
            v-model="formSave.receiverAddress"
            type="textarea"
            :rows="2"
            placeholder="收货地址"
            maxlength="512"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="formSave.status" style="width: 100%">
            <ElOption
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="订单明细" required>
          <div class="order-items-block">
            <ElTable :data="formSave.orderItems" border>
              <ElTableColumn label="商品" width="200">
                <template #default="{ row }">
                  <ElSelect
                    v-model="row.productId"
                    placeholder="请先选商品"
                    clearable
                    filterable
                    style="width: 100%"
                    @change="(v: number | undefined) => onProductChange(row, v)"
                  >
                    <ElOption
                      v-for="p in productOptions"
                      :key="p.value"
                      :label="p.label"
                      :value="p.value"
                    />
                  </ElSelect>
                </template>
              </ElTableColumn>
              <ElTableColumn label="SKU" width="220">
                <template #default="{ row }">
                  <ElSelect
                    v-model="row.skuId"
                    placeholder="请先选商品"
                    clearable
                    filterable
                    :disabled="!row.productId"
                    style="width: 100%"
                  >
                    <ElOption
                      v-for="s in getSkuOptions(row.productId)"
                      :key="s.value"
                      :label="s.label"
                      :value="s.value"
                    />
                  </ElSelect>
                </template>
              </ElTableColumn>
              <ElTableColumn label="数量" width="120">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.quantity" :min="1" style="width: 100%" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="80" fixed="right">
                <template #default="{ row }">
                  <ElButton
                    type="danger"
                    link
                    @click="removeOrderItem(formSave.orderItems.indexOf(row))"
                  >
                    删除
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
            <ElButton class="add-item-btn" @click="addOrderItem">
              添加明细
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<style scoped>
.order-edit {
  padding: 24px;
  min-height: 100%;
}

.order-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.order-edit-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.order-edit-actions {
  display: flex;
  gap: 12px;
}

.order-edit-content {
  max-width: 900px;
}

.order-edit-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.order-items-block {
  width: 100%;
}

.add-item-btn {
  margin-top: 12px;
}
</style>
