<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClientApi } from '#/api/core/client';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ElAvatar, ElTag } from 'element-plus';

import { getClientListApi } from '#/api';

interface RowType extends ClientApi.PaginatedClient {}

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
        placeholder: '请输入客户姓名',
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'realName',
      label: '客户姓名',
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
    {
      field: 'avatar',
      title: '头像',
      width: 100,
      slots: { default: 'avatar' },
    },
    { field: 'realName', title: '客户姓名', width: 120 },
    { field: 'mobile', title: '手机号', width: 150 },
    {
      field: 'status',
      width: 120,
      title: '状态',
      slots: { default: 'status' },
    },
    { field: 'description', title: '描述', minWidth: 200 },
    { field: 'createAt', title: '创建时间', width: 200 },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getClientListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 获取状态标签类型
 */
function getStatusTagType(status: string) {
  // 根据实际的状态值返回对应的标签类型
  // 这里可以根据实际业务需求调整
  if (status === 'ACTIVE' || status === '正常') {
    return 'success';
  }
  if (status === 'INACTIVE' || status === '禁用') {
    return 'info';
  }
  return 'warning';
}

/**
 * 获取状态文本
 */
function getStatusText(status: string) {
  return status || '-';
}
</script>

<template>
  <Page>
    <Grid>
      <template #avatar="{ row }">
        <ElAvatar
          v-if="row.avatar"
          :src="row.avatar"
          :size="40"
        />
        <ElAvatar
          v-else
          :size="40"
        >
          {{ row.realName?.charAt(0) || '客' }}
        </ElAvatar>
      </template>
      <template #status="{ row }">
        <ElTag :type="getStatusTagType(row.status)">
          {{ getStatusText(row.status) }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>

