<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ConfigurationApi } from '#/api/core/configuration';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { useDebounceFn } from '@vueuse/core';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createConfigurationApi,
  deleteConfigurationApi,
  getConfigurationApi,
  getConfigurationListApi,
  updateConfigurationApi,
  getModelOptionsApi,
} from '#/api';

interface RowType extends ConfigurationApi.PaginatedConfiguration {}

// 型号搜索关键词
const modelSearchKeyword = ref('');

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
      component: 'ApiSelect',
      componentProps: () => {
        return {
          api: getModelOptionsApi,
          filterOption: false,
          onSearch: useDebounceFn((value: string) => {
            modelSearchKeyword.value = value;
          }, 300),
          params: {
            modelName: modelSearchKeyword.value || undefined,
          },
          showSearch: true,
          placeholder: '请输入型号名称搜索',
        };
      },
      defaultValue: undefined,
      fieldName: 'modelId',
      label: '型号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入存储容量',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'storage',
      label: '存储容量',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入颜色',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'color',
      label: '颜色',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '全新', value: 'NEW' },
          { label: '预激活', value: 'PRE_ACTIVATION' },
        ],
        placeholder: '请选择激活状态',
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'activationStatus',
      label: '激活状态',
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
    { field: 'storage', title: '存储容量' },
    { field: 'color', title: '颜色' },
    {
      field: 'activationStatus',
      title: '激活状态',
      slots: { default: 'activationStatus' },
    },
    { field: 'createdAt', title: '创建时间' },
    { field: 'action', title: '操作',width: 200, fixed: 'right', slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getConfigurationListApi({
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
        api: getModelOptionsApi,
        filterOption: false,
        onSearch: useDebounceFn((value: string) => {
          modelSearchKeyword.value = value;
        }, 300),
        params: {
          modelName: modelSearchKeyword.value || undefined,
        },
        showSearch: true,
        placeholder: '请输入型号名称搜索',
      };
    },
    fieldName: 'modelId',
    label: '型号',
    rules: 'selectRequired',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入存储容量，如256G、512G',
    },
    fieldName: 'storage',
    label: '存储容量',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入颜色，如黑色、白色',
    },
    fieldName: 'color',
    label: '颜色',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '全新', value: 'NEW' },
        { label: '预激活', value: 'PRE_ACTIVATION' },
      ],
      placeholder: '请选择激活状态',
    },
    fieldName: 'activationStatus',
    label: '激活状态',
    defaultValue: 'NEW',
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
      label: '配置ID',
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
    modelSearchKeyword.value = '';
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
    const res = await getConfigurationApi(row.id);

    UpdateFormApi.setValues({
      ...res,
      modelId: res.modelId.toString(),
    });
    modelSearchKeyword.value = '';
  },
});

/**
 * 创建配置
 */
function onCreateConfiguration() {
  createdrawerApi.open();
}

/**
 * 编辑配置
 */
function onEditConfiguration(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建配置
 */
async function onCreate(values: Record<string, any>) {
  await createConfigurationApi({
    ...values,
    modelId: Number(values.modelId),
    activationStatus: values.activationStatus || 'NEW',
  } as ConfigurationApi.CreateConfigurationParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新配置
 */
async function onUpdate(values: Record<string, any>) {
  await updateConfigurationApi({
    ...values,
    id: Number(values.id),
    modelId: Number(values.modelId),
    activationStatus: values.activationStatus || 'NEW',
  } as ConfigurationApi.UpdateConfigurationParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除配置
 */
async function onDeleteConfiguration(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除该配置吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteConfigurationApi(row.id);
    await GridApi.reload();
  });
}

/**
 * 获取激活状态标签类型
 */
function getActivationStatusTagType(status: 'NEW' | 'PRE_ACTIVATION') {
  return status === 'NEW' ? 'success' : 'warning';
}

/**
 * 获取激活状态文本
 */
function getActivationStatusText(status: 'NEW' | 'PRE_ACTIVATION') {
  return status === 'NEW' ? '全新' : '预激活';
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateConfiguration">
            添加配置
          </ElButton>
        </AccessControl>
      </template>
      <template #activationStatus="{ row }">
        <ElTag :type="getActivationStatusTagType(row.activationStatus) as any">
          {{ getActivationStatusText(row.activationStatus) }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditConfiguration(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteConfiguration(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建配置">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑配置">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

