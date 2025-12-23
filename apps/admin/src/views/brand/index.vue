<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { BrandApi } from '#/api/core/brand';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createBrandApi,
  deleteBrandApi,
  getBrandApi,
  getBrandListApi,
  updateBrandApi,
} from '#/api';

interface RowType extends BrandApi.PaginatedBrand {}

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
        placeholder: '请输入品牌名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'brandName',
      label: '品牌名称',
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
    { field: 'id', title: 'ID', width: 80 },
    { field: 'brandName', title: '品牌名称' },
    { field: 'createdAt', title: '创建时间' },
    { field: 'action', title: '操作', slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getBrandListApi({
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
 * 创建表单选项
 */
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入品牌名称',
    },
    fieldName: 'brandName',
    label: '品牌名称',
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
      label: '品牌ID',
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
    const res = await getBrandApi(row.id);

    UpdateFormApi.setValues(res);
  },
});

/**
 * 创建品牌
 */
function onCreateBrand() {
  createdrawerApi.open();
}

/**
 * 编辑品牌
 */
function onEditBrand(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建品牌
 */
async function onCreate(values: Record<string, any>) {
  await createBrandApi(values as BrandApi.CreateBrandParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新品牌
 */
async function onUpdate(values: Record<string, any>) {
  await updateBrandApi(values as BrandApi.UpdateBrandParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除品牌
 */
async function onDeleteBrand(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.brandName}】的品牌吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteBrandApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateBrand">
            添加品牌
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditBrand(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteBrand(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建品牌">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑品牌">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

