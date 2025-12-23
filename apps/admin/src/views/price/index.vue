<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { PriceApi } from '#/api/core/price';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { useDebounceFn } from '@vueuse/core';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPriceApi,
  deletePriceApi,
  getConfigurationOptionsApi,
  getPriceApi,
  getPriceListApi,
  updatePriceApi,
} from '#/api';

interface RowType extends PriceApi.PaginatedPrice {}

// 配置搜索关键词
const configSearchKeyword = ref('');

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
          api: getConfigurationOptionsApi,
          filterOption: false,
          onSearch: useDebounceFn((value: string) => {
            configSearchKeyword.value = value;
          }, 300),
          params: {
            storage: configSearchKeyword.value || undefined,
          },
          showSearch: true,
          placeholder: '请输入存储容量搜索',
        };
      },
      defaultValue: undefined,
      fieldName: 'configId',
      label: '配置',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '有效', value: true },
          { label: '无效', value: false },
        ],
        placeholder: '请选择状态',
        clearable: true,
      },
      defaultValue: true,
      fieldName: 'isActive',
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
    { field: 'id', title: 'ID', width: 80 },
    { field: 'brandName', title: '品牌名称' ,width: 100},
    { field: 'modelName', title: '型号名称'  },
    { field: 'configName', title: '配置名称' ,width: 100 },
    { field: 'storage', title: '存储容量' ,width: 100 },
    { field: 'color', title: '颜色' ,width: 100 },
    {
      field: 'price',
      width: 100,
      title: '当前报价',
      formatter: ({ cellValue }) => {
        return cellValue ? `¥${Number(cellValue).toFixed(2)}` : '-';
      },
    },
    {
      field: 'changeAmount',
      width: 100,
      title: '价格变动',
      slots: { default: 'changeAmount' },
    },
    {
      field: 'isActive',
      width: 100,
      title: '状态',
      slots: { default: 'isActive' },
    },
    { field: 'createdAt', title: '创建时间' ,width: 200 },
    { field: 'updatedAt', title: '更新时间' ,width: 200 },
    { field: 'action', title: '操作',width: 200,fixed: 'right', slots: { default: 'action' } },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getPriceListApi({
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
        api: getConfigurationOptionsApi,
        filterOption: false,
        onSearch: useDebounceFn((value: string) => {
          configSearchKeyword.value = value;
        }, 300),
        params: {
          storage: configSearchKeyword.value || undefined,
        },
        showSearch: true,
        placeholder: '请输入存储容量搜索',
      };
    },
    fieldName: 'configId',
    label: '配置',
    rules: 'selectRequired',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入当前报价',
      precision: 2,
      min: 0,
      controlsPosition: 'right',
    },
    fieldName: 'price',
    label: '当前报价',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入价格变动值，正为涨，负为跌',
      precision: 2,
      controlsPosition: 'right',
    },
    fieldName: 'changeAmount',
    label: '价格变动值',
    defaultValue: 0,
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '有效', value: true },
        { label: '无效', value: false },
      ],
    },
    fieldName: 'isActive',
    label: '状态',
    defaultValue: false,
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
      label: '报价ID',
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
    configSearchKeyword.value = '';
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
    const res = await getPriceApi(row.id);

    UpdateFormApi.setValues({
      ...res,
      configId: res.configId.toString(),
    });
    configSearchKeyword.value = '';
  },
});

/**
 * 创建报价
 */
function onCreatePrice() {
  createdrawerApi.open();
}

/**
 * 编辑报价
 */
function onEditPrice(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建报价
 */
async function onCreate(values: Record<string, any>) {
  await createPriceApi({
    ...values,
    configId: Number(values.configId),
    price: Number(values.price),
    changeAmount: Number(values.changeAmount || 0),
    isActive:values.isActive || true,
  } as PriceApi.CreatePriceParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新报价
 */
async function onUpdate(values: Record<string, any>) {
  await updatePriceApi({
    ...values,
    id: Number(values.id),
    configId: Number(values.configId),
    price: Number(values.price),
    changeAmount: Number(values.changeAmount || 0),
    isActive: values.isActive || true,
  } as PriceApi.UpdatePriceParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除报价
 */
async function onDeletePrice(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除该报价吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deletePriceApi(row.id);
    await GridApi.reload();
  });
}

/**
 * 获取状态标签类型
 */
function getStatusTagType(isActive: boolean) {
  return isActive ? 'success' : 'info';
}

/**
 * 获取状态文本
 */
function getStatusText(isActive: boolean) {
  return isActive ? '有效' : '无效';
}

/**
 * 格式化价格变动值
 */
function formatChangeAmount(changeAmount: number): { text: string; type: 'primary' | 'success' | 'info' | 'warning' | 'danger' } {
  if (changeAmount === 0) {
    return { text: '无变动', type: 'info' };
  }
  if (changeAmount > 0) {
    return { text: `+¥${changeAmount.toFixed(2)}`, type: 'success' };
  }
  return { text: `¥${changeAmount.toFixed(2)}`, type: 'danger' };
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreatePrice">
            添加报价
          </ElButton>
        </AccessControl>
      </template>
      <template #changeAmount="{ row }">
        <ElTag :type="formatChangeAmount(row.changeAmount).type">
          {{ formatChangeAmount(row.changeAmount).text }}
        </ElTag>
      </template>
      <template #isActive="{ row }">
        <ElTag :type="getStatusTagType(row.isActive)">
          {{ getStatusText(row.isActive) }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditPrice(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeletePrice(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建报价">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑报价">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

