<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/core/user';

import { onMounted, ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
  USER_STATUS_TAG_TYPE,
} from '@vben/constants';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createUserApi,
  deleteUserApi,
  getRoleOptionsApi,
  getUserApi,
  getUserListApi,
  updateUserApi,
} from '#/api';
import { getFileUrl } from '#/composables/file';

interface RowType extends UserApi.PaginatedUser {
  password: string;
}

const roleOptions = ref<BasicOption[]>([]);

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
 * 加载角色选项
 */
async function loadRoleOptions() {
  const result = await getRoleOptionsApi();
  // select组件需要的选项格式,value需要是字符串
  const options = result.map((item) => ({
    label: item.label,
    value: item.value.toString(),
  }));
  roleOptions.value = options;
}

onMounted(() => loadRoleOptions());

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
        placeholder: 'Please enter email',
        type: 'email',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Please enter real name',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'realName',
      label: '昵称',
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
    { field: 'avatar', title: '头像', cellRender: { name: 'CellImage' } },
    { field: 'email', title: '邮箱' },
    { field: 'realName', title: '昵称' },
    { field: 'mobile', title: '手机号' },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
    },
    { field: 'createAt', title: '创建时间' },
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
        const result = await getUserListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        result.records.forEach((item: UserApi.PaginatedUser) => ({
          ...item,
          avatar: item.avatar ? getFileUrl(item.avatar) : '',
        }));

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
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'realName',
    // 界面显示的label
    label: '昵称',
    rules: 'required',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'email',
    // 界面显示的label
    label: '邮箱',
    dependencies: {
      disabled: (values) => !!values.id,
      triggerFields: ['id'],
    },
    rules: 'required',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'password',
    // 界面显示的label
    label: '密码',
    dependencies: {
      rules: (values) => {
        if (values.id) {
          return null;
        }
        return 'required';
      },
      triggerFields: ['id'],
    },
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'VbenSelect',
    // 对应组件的参数
    componentProps: {
      options: USER_STATUS_OPTIONS,
      placeholder: '请选择',
    },
    // 字段名
    fieldName: 'status',
    // 界面显示的label
    label: '状态',
    dependencies: {
      rules: (values) => {
        if (values.id) {
          return 'required';
        }
        return null;
      },
      triggerFields: ['id'],
    },
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Select',
    // 对应组件的参数
    componentProps: {
      filterable: true,
      multiple: true,
      options: [],
      placeholder: '请选择',
    },
    // 字段名
    fieldName: 'roleIds',
    // 界面显示的label
    label: '角色',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
      type: 'textarea',
    },
    // 字段名
    fieldName: 'description',
    // 界面显示的label
    label: '描述',
  },
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'mobile',
    // 界面显示的label
    label: '手机号',
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
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Input',
      // 对应组件的参数
      componentProps: {
        placeholder: '请输入',
        disabled: true,
      },
      // 字段名
      fieldName: 'id',
      // 界面显示的label
      label: '用户ID',
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
    if (!roleOptions.value?.length) {
      await loadRoleOptions();
    }
    CreateFormApi.updateSchema([
      {
        fieldName: 'roleIds',
        componentProps: { options: roleOptions.value },
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
    const res = await getUserApi(row.id);

    UpdateFormApi.setValues(res);
    if (!roleOptions.value?.length) {
      await loadRoleOptions();
    }
    UpdateFormApi.updateSchema([
      {
        fieldName: 'roleIds',
        componentProps: { options: roleOptions.value },
      },
    ]);
  },
});

/**
 * 创建用户
 */
function onCreateUser() {
  createdrawerApi.open();
}

/**
 * 编辑用户
 */
function onEditUser(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 创建用户
 */
async function onCreate(values: Record<string, any>) {
  await createUserApi(values as UserApi.CreateUserParams);
  createdrawerApi.close();
  await GridApi.reload();
}

/**
 * 更新用户
 */
async function onUpdate(values: Record<string, any>) {
  await updateUserApi(values as UserApi.UpdateUserParams);
  updatedrawerApi.close();
  await GridApi.reload();
}

/**
 * 删除用户
 */
async function onDeleteUser(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.email}】的用户吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteUserApi(row.id!);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateUser">
            添加用户
          </ElButton>
        </AccessControl>
      </template>
      <template #status="{ row }">
        <ElTag :type="USER_STATUS_TAG_TYPE[row.status] as any">
          {{ USER_STATUS[row.status] }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditUser(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteUser(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建用户">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑用户">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>
