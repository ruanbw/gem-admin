<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { StatusApi } from '#/api/core/status';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { onMounted, ref } from 'vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createStatusApi,
  deleteStatusApi,
  getConfigurationOptionsApi,
  getStatusApi,
  getStatusListApi,
  updateStatusApi,
} from '#/api';

interface RowType extends StatusApi.PaginatedStatus {}

const configOptions = ref<BasicOption[]>([]);

// 状态类型选项
const statusTypeOptions: BasicOption[] = [
  { label: '收购', value: 'ACQUISITION' },
  { label: '库存', value: 'INVENTORY' },
];

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
 * 加载配置选项
 */
async function loadConfigOptions() {
  const result = await getConfigurationOptionsApi();
  configOptions.value = result;
}


/**
 * 查询表单选项
 */
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择配置',
        clearable: true,
        filterable: true,
        options: [],
      },
      defaultValue: '',
      fieldName: 'configId',
      label: '配置',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态类型',
        clearable: true,
        options: statusTypeOptions,
      },
      defaultValue: '',
      fieldName: 'statusType',
      label: '状态类型',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入状态值',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'statusValue',
      label: '状态值',
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
    { field: 'brandName', title: '品牌名称', width: 100 },
    { field: 'modelName', title: '型号名称', width: 120 },
    { field: 'storage', title: '存储容量', width: 100 },
    { field: 'color', title: '颜色', width: 100 },
    {
      field: 'statusType',
      title: '状态类型',
      width: 100,
      slots: { default: 'statusType' },
    },
    { field: 'statusValue', title: '状态值', width: 120 },
    { field: 'createdAt', title: '创建时间', width: 180 },
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
        const result = await getStatusListApi({
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
 * 更新查询表单的配置选项
 */
async function updateFormConfigOptions() {
  if (configOptions.value.length > 0) {
    GridApi.formApi.updateSchema([
      {
        fieldName: 'configId',
        componentProps: { options: configOptions.value },
      },
    ]);
  }
}

// 在配置选项加载完成后更新表单
onMounted(async () => {
  await loadConfigOptions();
  await updateFormConfigOptions();
});

/**
 * 创建表单选项
 */
const schema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择配置',
      filterable: true,
      options: [],
    },
    fieldName: 'configId',
    label: '配置',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态类型',
      options: statusTypeOptions,
    },
    fieldName: 'statusType',
    label: '状态类型',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入状态值，如：AC+不收、大量要',
    },
    fieldName: 'statusValue',
    label: '状态值',
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
      label: '状态ID',
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
    if (!configOptions.value?.length) {
      await loadConfigOptions();
    }
    CreateFormApi.updateSchema([
      {
        fieldName: 'configId',
        componentProps: { options: configOptions.value },
      },
    ]);
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
    const res = await getStatusApi(row.id);

    UpdateFormApi.setValues({
      ...res,
      configId: res.configId.toString(),
    });
    if (!configOptions.value?.length) {
      await loadConfigOptions();
    }
    UpdateFormApi.updateSchema([
      {
        fieldName: 'configId',
        componentProps: { options: configOptions.value },
      },
    ]);
  },
});

/**
 * 创建状态
 */
function onCreateStatus() {
  createdrawerApi.open();
}

/**
 * 编辑状态
 */
function onEditStatus(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建状态
 */
async function onCreate(values: Record<string, any>) {
  await createStatusApi({
    configId: Number(values.configId),
    statusType: values.statusType,
    statusValue: values.statusValue,
  } as StatusApi.CreateStatusParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新状态
 */
async function onUpdate(values: Record<string, any>) {
  await updateStatusApi({
    id: Number(values.id),
    configId: Number(values.configId),
    statusType: values.statusType,
    statusValue: values.statusValue,
  } as StatusApi.UpdateStatusParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除状态
 */
async function onDeleteStatus(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.statusValue}】的状态吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteStatusApi(row.id);
    await GridApi.reload();
  });
}

/**
 * 获取状态类型标签
 */
function getStatusTypeLabel(statusType: StatusApi.StatusType) {
  return statusTypeOptions.find((item) => item.value === statusType)?.label || statusType;
}

/**
 * 获取状态类型标签类型
 */
function getStatusTypeTagType(statusType: StatusApi.StatusType) {
  return statusType === 'ACQUISITION' ? 'success' : 'info';
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateStatus">
            添加状态
          </ElButton>
        </AccessControl>
      </template>
      <template #statusType="{ row }">
        <ElTag :type="getStatusTypeTagType(row.statusType) as any">
          {{ getStatusTypeLabel(row.statusType) }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditStatus(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteStatus(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建状态">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑状态">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>

