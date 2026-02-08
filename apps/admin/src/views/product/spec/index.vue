<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SpecApi } from '#/api/core/spec';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSpecApi,
  deleteSpecApi,
  getSpecApi,
  getSpecListApi,
  updateSpecApi,
} from '#/api';

interface RowType extends SpecApi.PaginatedSpec {}

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
        placeholder: '请输入规格名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'name',
      label: '规格名称',
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
    { field: 'name', title: '规格名称', minWidth: 200 },
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
        const result = await getSpecListApi({
          current: page.currentPage,
          size: page.pageSize,
          name: formValues.name || undefined,
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 表单数据
const formData = ref<SpecApi.CreateSpecParams & { id?: number }>({
  name: '',
});

const loading = ref(false);
const saving = ref(false);

/**
 * 创建抽屉选项
 */
const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    // 重置表单
    formData.value = {
      name: '',
    };
    saving.value = false;
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
    if (!row?.id) {
      return;
    }
    loading.value = true;
    try {
      const spec = await getSpecApi(row.id);
      
      formData.value = {
        id: spec.id,
        name: spec.name,
      };
    }
    catch (err: any) {
      console.error('获取规格详情失败:', err);
      ElMessage.error(err.message || '获取规格详情失败');
    }
    finally {
      loading.value = false;
    }
  },
});

/**
 * 创建规格
 */
function onCreateSpec() {
  createdrawerApi.open();
}

/**
 * 编辑规格
 */
function onEditSpec(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 保存规格
 */
async function handleSubmit() {
  if (!formData.value.name?.trim()) {
    ElMessage.warning('请输入规格名称');
    return;
  }

  if (formData.value.name.length > 50) {
    ElMessage.warning('规格名称长度不能超过50个字符');
    return;
  }

  saving.value = true;
  try {
    if (formData.value.id) {
      await updateSpecApi({ 
        id: formData.value.id,
        name: formData.value.name,
      } as SpecApi.UpdateSpecParams);
      ElMessage.success('更新规格成功');
      updatedrawerApi.close();
    }
    else {
      await createSpecApi({ name: formData.value.name });
      ElMessage.success('创建规格成功');
      createdrawerApi.close();
    }

    await GridApi.reload();
  }
  catch (err: any) {
    console.error('保存规格失败:', err);
    ElMessage.error(err.message || '保存规格失败');
  }
  finally {
    saving.value = false;
  }
}

/**
 * 删除规格
 */
async function onDeleteSpec(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除规格【${row.name}】吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteSpecApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateSpec">
            添加规格
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditSpec(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteSpec(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    
    <CreateDrawer :title="'添加规格'">
      <div v-loading="loading" class="spec-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="规格名称" required>
            <ElInput
              v-model="formData.name"
              placeholder="请输入规格名称"
              maxlength="50"
              show-word-limit
            />
          </ElFormItem>

          <ElFormItem>
            <ElButton @click="createdrawerApi.close">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSubmit">
              保存
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>
    </CreateDrawer>

    <UpdateDrawer :title="'编辑规格'">
      <div v-loading="loading" class="spec-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="规格名称" required>
            <ElInput
              v-model="formData.name"
              placeholder="请输入规格名称"
              maxlength="50"
              show-word-limit
            />
          </ElFormItem>

          <ElFormItem>
            <ElButton @click="updatedrawerApi.close">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSubmit">
              保存
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>
    </UpdateDrawer>
  </Page>
</template>

<style scoped>
.spec-form-container {
  padding: 20px 0;
}
</style>

