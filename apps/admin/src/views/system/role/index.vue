<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { RoleApi } from '#/api/core/role';

import { nextTick, ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTree } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleApi,
  getRoleListApi,
  updateRoleApi,
} from '#/api';
import { getPermissionTreeApi } from '#/api/core/permission';

interface RowType extends RoleApi.Role {}

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Please enter role name',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'roleName',
      label: '角色名称',
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

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'id',
  },
  columns: [
    { field: 'roleName', title: '角色名称' },
    { field: 'roleCode', title: '角色编码' },
    { field: 'description', title: '描述' },
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
        return await getRoleListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const schema: VbenFormSchema[] = [
  {
    // 组件需要在 #/adapter.ts内注册，并加上类型
    component: 'Input',
    // 对应组件的参数
    componentProps: {
      placeholder: '请输入',
    },
    // 字段名
    fieldName: 'roleName',
    // 界面显示的label
    label: '角色名称',
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
    fieldName: 'roleCode',
    // 界面显示的label
    label: '角色编码',
    rules: 'required',
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
];

async function resetForm(api: any) {
  if (typeof api?.resetForm === 'function') {
    await api.resetForm(undefined, { keepValues: false });
  }
  if (typeof api?.resetValidate === 'function') {
    await api.resetValidate();
  }
}

const [CreateForm, CreateFormApi] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  // 提交函数
  handleSubmit: onCreate,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  scrollToFirstError: true,
  layout: 'horizontal',
  schema,
  wrapperClass: 'grid-cols-1',
});
const createTreeRef = ref<InstanceType<typeof ElTree>>();
const createCheckedPermissionIds = ref<number[]>([]);
const createPermissionTree = ref<any[]>([]);
const [UpdateForm, UpdateFormApi] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  // 提交函数
  handleSubmit: onUpdate,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  scrollToFirstError: true,
  layout: 'horizontal',
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
      label: '角色ID',
      rules: 'required',
    },
    ...schema,
  ],
  wrapperClass: 'grid-cols-1',
});
const updateTreeRef = ref<InstanceType<typeof ElTree>>();
const updateCheckedPermissionIds = ref<number[]>([]);
const updatePermissionTree = ref<any[]>([]);

const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    await resetForm(CreateFormApi);
    createCheckedPermissionIds.value = [];
    createPermissionTree.value = (await getPermissionTreeApi()) as any[];
    await nextTick();
    createTreeRef.value?.setCheckedKeys(createCheckedPermissionIds.value);
  },
});
const [UpdateDrawer, updatedrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    const row = updatedrawerApi.getData();
    await resetForm(UpdateFormApi);
    if (!row?.id) {
      return;
    }
    const res = await getRoleApi(row.id);
    UpdateFormApi.setValues(res);
    updateCheckedPermissionIds.value = (res?.permissionIds || []) as number[];
    updatePermissionTree.value = (await getPermissionTreeApi()) as any[];
    await nextTick();
    updateTreeRef.value?.setCheckedKeys(updateCheckedPermissionIds.value);
  },
});

function handleEdit(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}
async function onCreate(values: Record<string, any>) {
  const permissionIds = (createTreeRef.value?.getCheckedKeys(false) ||
    []) as number[];
  await createRoleApi({ ...(values as RowType), permissionIds });
  createdrawerApi.close();
  await GridApi.reload();
}
async function onUpdate(values: Record<string, any>) {
  const permissionIds = (updateTreeRef.value?.getCheckedKeys(false) ||
    []) as number[];
  await updateRoleApi({ ...(values as RowType), permissionIds });
  updatedrawerApi.close();
  await GridApi.reload();
}
async function handleDelete(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.roleName}】的角色吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteRoleApi(row.id!);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="createdrawerApi.open">
            添加角色
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="handleEdit(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="handleDelete(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建角色">
      <CreateForm />
      <ElTree
        ref="createTreeRef"
        :data="createPermissionTree"
        node-key="id"
        show-checkbox
        :props="{ children: 'children', label: 'title' }"
        :default-checked-keys="createCheckedPermissionIds"
        check-on-click-node
        :check-strictly="false"
      />
    </CreateDrawer>
    <UpdateDrawer title="编辑角色">
      <UpdateForm />
      <ElTree
        ref="updateTreeRef"
        :data="updatePermissionTree"
        node-key="id"
        show-checkbox
        :props="{ children: 'children', label: 'title' }"
        :default-checked-keys="updateCheckedPermissionIds"
        check-on-click-node
        :check-strictly="false"
      />
    </UpdateDrawer>
  </Page>
</template>
