<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OrderApi } from '#/api/core/order';

import { useRouter } from 'vue-router';

import { AccessControl } from '@vben/access';
import { Page } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteOrderApi, getOrderListApi } from '#/api';

interface RowType extends OrderApi.OrderPageResponse {}

const ORDER_STATUS_OPTIONS: { label: string; value: OrderApi.OrderStatus }[] = [
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '已支付', value: 'PAID' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '完成', value: 'COMPLETED' },
  { label: '取消', value: 'CANCELLED' },
];

const STATUS_TAG_MAP: Record<OrderApi.OrderStatus, { label: string; type: 'success' | 'info' | 'warning' | 'danger' }> = {
  PENDING_PAYMENT: { label: '待支付', type: 'warning' },
  PAID: { label: '已支付', type: 'info' },
  SHIPPED: { label: '已发货', type: 'info' },
  COMPLETED: { label: '完成', type: 'success' },
  CANCELLED: { label: '取消', type: 'danger' },
};

const router = useRouter();

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户ID',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'userId',
      label: '用户ID',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: ORDER_STATUS_OPTIONS,
      },
      defaultValue: '',
      fieldName: 'status',
      label: '状态',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: '查询' },
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: { highlight: true, labelField: 'id' },
  columns: [
    { field: 'orderNo', title: '订单号', minWidth: 160 },
    { field: 'userId', title: '用户ID', width: 100 },
    { field: 'receiverName', title: '收货人', width: 100 },
    { field: 'receiverPhone', title: '手机号', width: 130 },
    { field: 'receiverAddress', title: '收货地址', minWidth: 200, showOverflow: true },
    {
      field: 'totalAmount',
      title: '总金额',
      width: 120,
      formatter: ({ cellValue }) => (cellValue != null ? `¥${Number(cellValue).toFixed(2)}` : '-'),
    },
    { field: 'status', title: '状态', width: 100, slots: { default: 'status' } },
    { field: 'createdAt', title: '创建时间', width: 180 },
    { field: 'action', title: '操作', width: 200, slots: { default: 'action' }, fixed: 'right' },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: { result: 'records' },
    ajax: {
      query: async ({ page }, formValues) => {
        const params = {
          current: page.currentPage,
          size: page.pageSize,
          userId: formValues?.userId != null && formValues?.userId !== '' ? Number(formValues.userId) : undefined,
          status: formValues?.status && formValues?.status !== '' ? formValues.status : undefined,
        };
        return getOrderListApi(params);
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onAdd() {
  router.push('/order/edit');
}

function onViewDetail(row: RowType) {
  router.push(`/order/detail?id=${row.id}`);
}

function onEdit(row: RowType) {
  router.push(`/order/edit?id=${row.id}`);
}

async function onDelete(row: RowType) {
  ElMessageBox.confirm(`删除后数据不可恢复，确认删除订单【${row.orderNo}】吗？`, '警告', {
    type: 'warning',
  }).then(async () => {
    await deleteOrderApi(row.id);
    await GridApi.reload();
  });
}

function getStatusMeta(status: OrderApi.OrderStatus) {
  return STATUS_TAG_MAP[status] ?? { label: String(status), type: 'info' as const };
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onAdd">
            新增订单
          </ElButton>
        </AccessControl>
      </template>
      <template #status="{ row }">
        <ElTag :type="getStatusMeta(row.status).type">
          {{ getStatusMeta(row.status).label }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" link @click="onViewDetail(row)">查看</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEdit(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDelete(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
  </Page>
</template>
