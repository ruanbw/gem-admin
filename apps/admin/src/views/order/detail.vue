<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { ElCard, ElDescriptions, ElButton, ElDescriptionsItem, ElTag, ElSkeleton, ElMessageBox, ElMessage } from 'element-plus';
import type { OrderApi } from '#/api/core/order';
import { getOrderDetailApi, updateOrderTrackingNumberApi } from '#/api';
import { useRoute } from 'vue-router';

const route = useRoute();

const loading = ref(false);
const detail = ref<OrderApi.OrderDetail | null>(null);

const orderId = computed(() => route.query.id as string | undefined);

/**
 * 获取类型标签类型
 */
function getTypeTagType(type: OrderApi.OrderType | undefined) {
  switch (type) {
    case 'BUY':
      return 'primary';
    case 'SELL':
      return 'success';
    default:
      return 'info';
  }
}

/**
 * 获取类型中文文本
 */
function getTypeText(type: OrderApi.OrderType | undefined) {
  switch (type) {
    case 'BUY':
      return '购买';
    case 'SELL':
      return '卖出';
    default:
      return type || '-';
  }
}

/**
 * 获取状态标签类型
 */
function getStatusTagType(status: OrderApi.OrderStatus | undefined) {
  switch (status) {
    case 'PAID':
    case 'SETTLED':
    case 'COMPLETED':
      return 'success';
    case 'REFUND_AND_AFTER_SALES':
    case 'RETURNED':
      return 'danger';
    case 'PENDING_PAYMENT':
    case 'AWAITING_STORAGE':
    case 'PENDING_SHIPMENT':
    case 'PENDING_SETTLEMENT':
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * 获取状态中文文本
 */
function getStatusText(status: OrderApi.OrderStatus | undefined) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return '待付款';
    case 'PAID':
      return '待收货';
    case 'REFUND_AND_AFTER_SALES':
      return '退款/售后';
    case 'AWAITING_STORAGE':
      return '待入库';
    case 'PENDING_SHIPMENT':
      return '待出货';
    case 'PENDING_SETTLEMENT':
      return '待结算';
    case 'SETTLED':
      return '已结算';
    case 'RETURNED':
      return '退货';
    case 'COMPLETED':
      return '已完成';
    default:
      return status || '-';
  }
}

const fullAddress = computed(() => {
  const addr = detail.value?.clientAddress;
  if (!addr) return '-';
  return `${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detailAddress || ''}` || '-';
});

async function fetchDetail() {
  if (!orderId.value) return;
  loading.value = true;
  try {
    const data = await getOrderDetailApi(orderId.value);
    detail.value = data;
  } finally {
    loading.value = false;
  }
}

async function handleShip(id: number) {
  if (!detail.value || detail.value.status !== 'PAID') {
    return;
  }

  try {
    const { value, action } = await ElMessageBox.prompt('请输入新的物流单号', '修改物流单号', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入物流单号',
      inputPattern: /\S+/,
      inputErrorMessage: '物流单号不能为空',
      inputValue: detail.value.trackingNumber || '',
    });

    if (action === 'confirm') {
      await updateOrderTrackingNumberApi(id, value);
      ElMessage.success('物流单号修改成功');
      await fetchDetail();
    }
  } catch {
    // 用户取消或关闭弹窗
  }
}

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <Page>
    <template #title>
      <div class="flex flex-col gap-1">
        <h1>订单详情</h1>
        <p v-if="detail" class="text-sm text-gray-500 mt-1">
          订单号：{{ detail.orderNo }}
        </p>
        <p v-else class="text-sm text-gray-500 mt-1">
          订单号：{{ orderId || '-' }}
        </p>
      </div>
    </template>

    <ElSkeleton :loading="loading" animated>
      <template #template>
        <div class="space-y-4">
          <ElCard>
            <div class="h-6 w-32 mb-4 bg-gray-200 rounded" />
            <div class="space-y-2">
              <div class="h-4 w-full bg-gray-200 rounded" />
              <div class="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          </ElCard>
          <ElCard>
            <div class="h-6 w-32 mb-4 bg-gray-200 rounded" />
            <div class="space-y-2">
              <div class="h-4 w-full bg-gray-200 rounded" />
              <div class="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          </ElCard>
        </div>
      </template>

      <template #default>
        <div v-if="detail" class="space-y-4">
          <!-- 基本信息 -->
          <ElCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span>基本信息</span>
                <div class="flex items-center gap-2">
                  <ElTag :type="getTypeTagType(detail.type)">
                    {{ getTypeText(detail.type) }}
                  </ElTag>
                  <ElTag :type="getStatusTagType(detail.status)">
                    {{ getStatusText(detail.status) }}
                  </ElTag>
                </div>
              </div>
            </template>

            <ElDescriptions :column="3" border>
              <ElDescriptionsItem label="订单号">
                {{ detail.orderNo }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="用户 OpenId">
                {{ detail.openId }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="订单金额">
                ¥{{ detail.totalPrice?.toFixed(2) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="订单类型">
                {{ getTypeText(detail.type) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="订单状态">
                {{ getStatusText(detail.status) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="创建时间">
                {{ detail.createdAt }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="物流单号">
                <div class="flex items-center justify-between gap-2">
                  <p>{{ detail.trackingNumber || '-' }}</p>
                  <ElButton v-if="detail.trackingNumber && detail.status === 'PAID'"
                    @click="handleShip(detail.id)" type="primary">
                    修改
                  </ElButton>
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="备注">
                {{ detail.remark || '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- 收货地址 -->
            <ElCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <span>收货信息</span>
                  <ElTag v-if="detail.clientAddress?.isDefault" type="success">
                    默认地址
                  </ElTag>
                </div>
              </template>

              <ElDescriptions :column="1" border>
                <ElDescriptionsItem label="收货人">
                  {{ detail.clientAddress?.receiverName || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="手机号">
                  {{ detail.clientAddress?.mobile || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="收货地址">
                  {{ fullAddress }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="地址状态">
                  {{ detail.clientAddress?.status === 'deleted' ? '已删除' : '正常' }}
                </ElDescriptionsItem>
              </ElDescriptions>
            </ElCard>

            <!-- 配置信息快照 -->
            <ElCard>
              <template #header>
                <span>配置快照</span>
              </template>

              <ElDescriptions :column="1" border>
                <ElDescriptionsItem label="品牌">
                  {{ detail.orderSnapshot?.brand || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="型号">
                  {{ detail.orderSnapshot?.model || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="配置">
                  {{ detail.orderSnapshot?.config || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="快照时间">
                  {{ detail.orderSnapshot?.createAt || '-' }}
                </ElDescriptionsItem>
              </ElDescriptions>
            </ElCard>
          </div>
        </div>

        <div v-else class="text-center text-gray-500 py-10">
          暂无订单详情数据
        </div>
      </template>
    </ElSkeleton>
  </Page>
</template>
