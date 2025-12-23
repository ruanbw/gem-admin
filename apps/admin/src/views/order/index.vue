<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OrderApi } from '#/api/core/order';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ElButton, ElTag, ElMessageBox, ElMessage } from 'element-plus';

import { getOrderListApi, updateOrderTrackingNumberApi } from '#/api';
import { useRouter } from 'vue-router';

interface RowType extends OrderApi.PaginatedOrder {}

/**
 * 查询表单选项
 */
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入订单号',
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'orderNo',
      label: '订单号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户 OpenId',
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'openId',
      label: '用户 OpenId',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择订单类型',
        allowClear: true,
        options: [
          { label: '购买', value: 'BUY' },
          { label: '卖出', value: 'SELL' },
        ],
      },
      defaultValue: undefined,
      fieldName: 'type',
      label: '订单类型',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择订单状态',
        allowClear: true,
        options: [
          { label: '待付款', value: 'PENDING_PAYMENT' },
          { label: '待收货', value: 'PAID' },
          { label: '退款/售后', value: 'REFUND_AND_AFTER_SALES' },
          { label: '待入库', value: 'AWAITING_STORAGE' },
          { label: '待出货', value: 'PENDING_SHIPMENT' },
          { label: '待结算', value: 'PENDING_SETTLEMENT' },
          { label: '已结算', value: 'SETTLED' },
          { label: '退货', value: 'RETURNED' },
          { label: '已完成', value: 'COMPLETED' },
        ],
      },
      defaultValue: undefined,
      fieldName: 'status',
      label: '订单状态',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

/**
 * 表格选项
 */
const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'orderNo', title: '订单号', minWidth: 180 },
    { field: 'openId', title: '用户 OpenId', minWidth: 200 },
    {
      field: 'type',
      width: 100,
      title: '类型',
      slots: { default: 'type' },
    },
    {
      field: 'totalPrice',
      title: '总价',
      width: 120,
      formatter: ({ cellValue }) => {
        return cellValue != null ? `¥${Number(cellValue).toFixed(2)}` : '-';
      },
    },
    {
      field: 'status',
      width: 120,
      title: '状态',
      slots: { default: 'status' },
    },
    {
      field: 'trackingNumber',
      width: 200,
      title: '物流单号',
    },
    {
      field: 'remark',
      width: 120,
      title: '备注',
    },
    { field: 'createdAt', title: '创建时间', width: 200 },
    { field: 'action', title: '操作', width: 200, fixed: 'right', slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getOrderListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        return result;
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 获取类型标签类型
 */
function getTypeTagType(type: string) {
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
function getTypeText(type: string) {
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
 * 购买订单状态: PENDING_PAYMENT(待付款), PAID(待收货), REFUND_AND_AFTER_SALES(退款/售后)
 * 卖出订单状态: AWAITING_STORAGE(待入库), PENDING_SHIPMENT(待出货), PENDING_SETTLEMENT(待结算), SETTLED(已结算), RETURNED(退货)
 * 公共状态: COMPLETED(已完成)
 */
function getStatusTagType(status: string) {
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
function getStatusText(status: string) {
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

const router = useRouter();

function handleView(id: number) {
  router.push(`/order/detail?id=${id}`);
}

async function handleShip(row: RowType) {
  if (row.status !== 'PAID') {
    return;
  }

  try {
    const { value, action } = await ElMessageBox.prompt('请输入物流单号', '发货', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入物流单号',
      inputPattern: /\S+/,
      inputErrorMessage: '物流单号不能为空',
    });

    if (action === 'confirm') {
      await updateOrderTrackingNumberApi(row.id, value);
      ElMessage.success('发货成功');
      // 如需刷新表格，可在此处补充表格刷新逻辑
    }
  } catch {
    // 用户取消或关闭弹窗，不做处理
  }
}
</script>

<template>
  <Page>
    <Grid>
      <template #action="{ row }">
        <ElButton v-if="row.status === 'PAID' && !row.trackingNumber" type="primary" link @click="handleShip(row as RowType)">
          发货
        </ElButton>
        <ElButton type="info" link @click="handleView(row.id)">
          查看
        </ElButton>
      </template>
      <template #type="{ row }">
        <ElTag :type="getTypeTagType(row.type as string)">
          {{ getTypeText(row.type as string) }}
        </ElTag>
      </template>
      <template #status="{ row }">
        <ElTag :type="getStatusTagType(row.status as string)">
          {{ getStatusText(row.status as string) }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
