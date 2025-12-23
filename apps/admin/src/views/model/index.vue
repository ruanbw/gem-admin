<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ModelApi } from '#/api/core/model';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { useDebounceFn } from '@vueuse/core';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createModelApi,
  deleteModelApi,
  getModelApi,
  getModelListApi,
  updateModelApi,
  getBrandOptionsApi,
} from '#/api';

interface RowType extends ModelApi.PaginatedModel {}

// 品牌搜索关键词
const brandSearchKeyword = ref('');

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
        placeholder: '请输入型号名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'modelName',
      label: '型号名称',
    },
    {
      component: 'ApiSelect',
      componentProps: () => {
        return {
          api: getBrandOptionsApi,
          filterOption: false,
          onSearch: useDebounceFn((value: string) => {
            brandSearchKeyword.value = value;
          }, 300),
          params: {
            brandName: brandSearchKeyword.value || undefined,
          },
          showSearch: true,
          placeholder: '请输入品牌名称搜索',
        };
      },
      defaultValue: undefined,
      fieldName: 'brandId',
      label: '品牌',
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
    { field: 'modelName', title: '型号名称' },
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
        const result = await getModelListApi({
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
    component: 'ApiSelect',
    componentProps: () => {
      return {
        api: getBrandOptionsApi,
        filterOption: false,
        onSearch: useDebounceFn((value: string) => {
          brandSearchKeyword.value = value;
        }, 300),
        params: {
          brandName: brandSearchKeyword.value || undefined,
        },
        showSearch: true,
        placeholder: '请输入品牌名称搜索',
      };
    },
    fieldName: 'brandId',
    label: '品牌',
    rules: 'selectRequired',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入型号名称',
    },
    fieldName: 'modelName',
    label: '型号名称',
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
      label: '型号ID',
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
    brandSearchKeyword.value = '';
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
    const res = await getModelApi(row.id);

    UpdateFormApi.setValues({
      ...res,
      brandId: res.brandId.toString(),
    });
    brandSearchKeyword.value = '';
  },
});

/**
 * 创建型号
 */
function onCreateModel() {
  createdrawerApi.open();
}

/**
 * 编辑型号
 */
function onEditModel(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建型号
 */
async function onCreate(values: Record<string, any>) {
  await createModelApi({
    ...values,
    brandId: Number(values.brandId),
  } as ModelApi.CreateModelParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新型号
 */
async function onUpdate(values: Record<string, any>) {
  await updateModelApi({
    ...values,
    id: Number(values.id),
    brandId: Number(values.brandId),
  } as ModelApi.UpdateModelParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除型号
 */
async function onDeleteModel(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.modelName}】的型号吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteModelApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateModel">
            添加型号
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditModel(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteModel(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建型号">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑型号">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

