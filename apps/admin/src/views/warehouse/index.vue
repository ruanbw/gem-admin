<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { WarehouseApi } from '#/api/core/warehouse';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWarehouseApi,
  deleteWarehouseApi,
  getWarehouseApi,
  getWarehouseListApi,
  updateWarehouseApi,
} from '#/api';

interface RowType extends WarehouseApi.Warehouse {}

/**
 * 重置表单
 */
async function resetForm(api: any) {
  if (typeof api?.resetFields === 'function') {
    await api.resetFields();
  }
  if (typeof api?.resetValidation === 'function') {
    await api.resetValidation();
  }
}

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
        placeholder: '请输入仓库名',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'warehouseName',
      label: '仓库名',
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
    { field: 'id', title: 'ID' },
    { field: 'warehouseName', title: '仓库名' },
    {
      field: 'type',
      title: '仓库类型',
      formatter: ({ cellValue }) => {
        return cellValue === 'self_operated' ? '自营' : cellValue === 'three_parties' ? '三方' : '';
      },
    },
    { field: 'address', title: '地址' },
    { field: 'contactPerson', title: '联系人' },
    { field: 'contactPhone', title: '联系电话' },
    { field: 'recyclingCategories', title: '回收品类' },
    { field: 'createAt', title: '创建时间' },
    { field: 'action', title: '操作',width: 200, slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        return await getWarehouseListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 创建表单选项
 */
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入仓库名',
    },
    fieldName: 'warehouseName',
    label: '仓库名',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '自营', value: 'self_operated' },
        { label: '三方', value: 'three_parties' },
      ],
      placeholder: '请选择仓库类型',
    },
    defaultValue: 'self_operated',
    fieldName: 'type',
    label: '仓库类型',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入地址',
    },
    fieldName: 'address',
    label: '地址',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入联系人',
    },
    fieldName: 'contactPerson',
    label: '联系人',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入联系电话',
    },
    fieldName: 'contactPhone',
    label: '联系电话',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入回收品类',
      type: 'textarea',
      maxlength: 200,
      rows: 3,
      showCount: true,
    },
    fieldName: 'recyclingCategories',
    label: '回收品类',
    rules: 'required',
  },
];

const [CreateForm, CreateFormApi] = useVbenForm({
  // 提交函数
  handleSubmit: onCreate,
  schema,
});

/**
 * 编辑表单选项
 */
const [UpdateForm, UpdateFormApi] = useVbenForm({
  // 提交函数
  handleSubmit: onUpdate,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        disabled: true,
      },
      fieldName: 'id',
      label: '仓库ID',
      rules: 'required',
    },
    ...schema,
  ],
});

/**
 * 创建抽屉选项
 */
const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    await resetForm(CreateFormApi);
  },
});

/**
 * 编辑抽屉选项
 */
const [UpdateDrawer, updatedrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    const row = updatedrawerApi.getData();
    await resetForm(UpdateFormApi);
    if (!row?.id) {
      return;
    }
    const res = await getWarehouseApi(row.id);
    UpdateFormApi.setValues(res);
  },
});

/**
 * 创建仓库
 */
function onCreateWarehouse() {
  createdrawerApi.open();
}

/**
 * 编辑仓库
 */
function onEditWarehouse(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建仓库
 */
async function onCreate(values: Record<string, any>) {
  await createWarehouseApi(values as WarehouseApi.CreateWarehouseParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新仓库
 */
async function onUpdate(values: Record<string, any>) {
  await updateWarehouseApi(values as WarehouseApi.UpdateWarehouseParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除仓库
 */
async function onDeleteWarehouse(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.warehouseName}】的仓库吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteWarehouseApi(row.id!);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <ElButton class="mr-2" type="primary" @click="onCreateWarehouse">
          添加仓库
        </ElButton>
      </template>
      <template #action="{ row }">
        <ElButton type="primary" @click="onEditWarehouse(row)">编辑</ElButton>
        <ElButton type="danger" @click="onDeleteWarehouse(row)">删除</ElButton>
      </template>
    </Grid>
    <CreateDrawer title="创建仓库">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑仓库">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

