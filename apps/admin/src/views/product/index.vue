<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ProductApi } from '#/api/core/product';

import { useRouter } from 'vue-router';

import { AccessControl } from '@vben/access';
import { Page } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProductApi,
  getProductListApi,
} from '#/api';
import { getFileUrl } from '#/composables/file';

interface RowType extends ProductApi.PaginatedProduct {}

const router = useRouter();

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
        placeholder: '请输入商品名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'name',
      label: '商品名称',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '上架', value: 'ONLINE' },
          { label: '下架', value: 'OFFLINE' },
        ],
      },
      defaultValue: '',
      fieldName: 'status',
      label: '状态',
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
  checkboxConfig: {
    highlight: true,
    labelField: 'id',
  },
  columns: [
    { field: 'coverImage', title: '封面图', cellRender: { name: 'CellImage' }, width: 120 },
    { field: 'name', title: '商品名称', minWidth: 200 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'createdAt', title: '创建时间', width: 180 },
    { field: 'action', title: '操作', width: 150, slots: { default: 'action' }, fixed: 'right' },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getProductListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        // 处理封面图URL
        result.records.forEach((item: ProductApi.PaginatedProduct) => {
          if (item.coverImage) {
            item.coverImage = getFileUrl(item.coverImage);
          }
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 创建商品
 */
function onCreateProduct() {
  router.push('/product/edit');
}

/**
 * 编辑商品
 */
function onEditProduct(row: RowType) {
  router.push(`/product/edit?id=${row.id}`);
}

/**
 * 删除商品
 */
async function onDeleteProduct(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.name}】的商品吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteProductApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateProduct">
            添加商品
          </ElButton>
        </AccessControl>
      </template>
      <template #status="{ row }">
        <ElTag :type="row.status === 'ONLINE' ? 'success' : 'info'">
          {{ row.status === 'ONLINE' ? '上架' : '下架' }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditProduct(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteProduct(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
  </Page>
</template>

