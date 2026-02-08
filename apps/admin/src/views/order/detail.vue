<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ElButton, ElDescriptions, ElDescriptionsItem, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { getOrderDetailApi } from '#/api';

const STATUS_LABEL: Record<OrderApi.OrderStatus, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  COMPLETED: '完成',
  CANCELLED: '取消',
};

const route = useRoute();
const router = useRouter();

const orderId = computed(() => {
  const id = route.query.id;
  return id ? Number(id) : undefined;
});

const loading = ref(false);
const detail = ref<OrderApi.OrderResponse | null>(null);

async function fetchDetail() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    detail.value = await getOrderDetailApi(orderId.value);
  } catch (err: any) {
    ElMessage.error(err?.message || '获取订单详情失败');
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/order');
}

function goEdit() {
  if (orderId.value) router.push(`/order/edit?id=${orderId.value}`);
}

onMounted(() => {
  if (orderId.value) fetchDetail();
});
</script>

<template>
  <div v-loading="loading" class="order-detail">
    <div class="order-detail-header">
      <h2>订单详情</h2>
      <div class="actions">
        <ElButton @click="goBack">返回</ElButton>
        <ElButton type="primary" @click="goEdit">编辑</ElButton>
      </div>
    </div>

    <template v-if="detail">
      <ElDescriptions :column="2" border class="order-detail-info">
        <ElDescriptionsItem label="订单号">
          {{ detail.orderNo }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用户ID">
          {{ detail.userId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收货人">
          {{ detail.receiverName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ detail.receiverPhone }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收货地址" :span="2">
          {{ detail.receiverAddress }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="总金额">
          ¥{{ detail.totalAmount != null ? Number(detail.totalAmount).toFixed(2) : '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag>{{ STATUS_LABEL[detail.status] ?? detail.status }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间" :span="2">
          {{ detail.createdAt }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <div v-if="detail.orderItems && detail.orderItems.length > 0" class="order-detail-items">
        <h3>订单明细</h3>
        <ElTable :data="detail.orderItems" border>
          <ElTableColumn prop="skuId" label="SKU ID" width="100" />
          <ElTableColumn prop="productName" label="商品/规格" min-width="160">
            <template #default="{ row }">
              {{ row.productName || row.skuCode || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="quantity" label="数量" width="100" />
          <ElTableColumn prop="price" label="单价" width="120">
            <template #default="{ row }">
              {{ row.price != null ? `¥${Number(row.price).toFixed(2)}` : '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="amount" label="小计" width="120">
            <template #default="{ row }">
              {{ row.amount != null ? `¥${Number(row.amount).toFixed(2)}` : (row.price != null && row.quantity != null ? `¥${(Number(row.price) * Number(row.quantity)).toFixed(2)}` : '-') }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
      <div v-else class="order-detail-items">
        <h3>订单明细</h3>
        <p class="empty-tip">暂无明细</p>
      </div>
    </template>
    <p v-else-if="!loading" class="empty-tip">未找到订单</p>
  </div>
</template>

<style scoped>
.order-detail {
  padding: 24px;
  min-height: 100%;
}

.order-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.order-detail-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}

.order-detail-info {
  margin-bottom: 24px;
}

.order-detail-items {
  margin-top: 24px;
}

.order-detail-items h3 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.empty-tip {
  color: #909399;
  font-size: 14px;
  margin: 12px 0 0;
}
</style>
