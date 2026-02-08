<script lang="ts" setup>
import type { BannerApi } from '#/api/core/banner';

import { onMounted, ref } from 'vue';

import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElUpload } from 'element-plus';
import type { UploadFiles } from 'element-plus';

import { getBannerApi, saveBannerApi } from '#/api';
import { requestClient } from '#/api/request';
import { getFileUrl } from '#/composables/file';

// 轮播项接口（包含上传文件列表）
interface BannerItemWithFileList extends BannerApi.BannerItem {
  fileList: UploadFiles;
  uploading: boolean;
  key: string; // 用于v-for的key
}

// 表单数据
const formData = ref<{ items: BannerItemWithFileList[] }>({
  items: [],
});

const loading = ref(false);
const saving = ref(false);

/**
 * 获取轮播图数据
 */
async function fetchBanner() {
  loading.value = true;
  try {
    const response = await getBannerApi();
    
    if (response && response.items) {
      // 转换数据格式，添加fileList和uploading
      formData.value.items = response.items.map((item, index) => ({
        imageUrl: item.imageUrl,
        linkUrl: item.linkUrl,
        fileList: item.imageUrl ? [{
          name: `banner-${index}`,
          url: getFileUrl(item.imageUrl),
          status: 'success' as const,
          uid: Date.now() + index,
        }] : [],
        uploading: false,
        key: `banner-item-${Date.now()}-${index}`,
      }));
    }
    else {
      formData.value.items = [];
    }
  }
  catch (err: any) {
    console.error('获取轮播图失败:', err);
    ElMessage.error(err.message || '获取轮播图失败');
    formData.value.items = [];
  }
  finally {
    loading.value = false;
  }
}

/**
 * 保存轮播图
 */
async function handleSubmit() {
  // 验证
  if (formData.value.items.length === 0) {
    ElMessage.warning('至少添加一个轮播项');
    return;
  }

  // 验证每个项是否都有图片和链接
  for (let i = 0; i < formData.value.items.length; i++) {
    const item = formData.value.items[i];
    if (!item.imageUrl) {
      ElMessage.warning(`第${i + 1}个轮播项缺少图片`);
      return;
    }
    if (!item.linkUrl || !item.linkUrl.trim()) {
      ElMessage.warning(`第${i + 1}个轮播项的链接地址不能为空`);
      return;
    }
  }

  saving.value = true;
  try {
    // 转换为API请求格式
    const request: BannerApi.SaveBannerRequest = {
      items: formData.value.items.map(item => ({
        imageUrl: item.imageUrl,
        linkUrl: item.linkUrl.trim(),
      })),
    };

    await saveBannerApi(request);
    ElMessage.success('保存成功');
  }
  catch (err: any) {
    console.error('保存轮播图失败:', err);
    ElMessage.error(err.message || '保存轮播图失败');
  }
  finally {
    saving.value = false;
  }
}

/**
 * 添加轮播项
 */
function addBannerItem() {
  formData.value.items.push({
    imageUrl: '',
    linkUrl: '',
    fileList: [],
    uploading: false,
    key: `banner-item-${Date.now()}-${Math.random()}`,
  });
}

/**
 * 删除轮播项
 */
function removeBannerItem(index: number) {
  formData.value.items.splice(index, 1);
}

/**
 * 上移轮播项
 */
function moveUp(index: number) {
  if (index <= 0) {
    return;
  }
  const item = formData.value.items[index];
  formData.value.items.splice(index, 1);
  formData.value.items.splice(index - 1, 0, item);
}

/**
 * 下移轮播项
 */
function moveDown(index: number) {
  if (index >= formData.value.items.length - 1) {
    return;
  }
  const item = formData.value.items[index];
  formData.value.items.splice(index, 1);
  formData.value.items.splice(index + 1, 0, item);
}

/**
 * 图片上传前的验证
 */
function beforeImageUpload(file: File, item: BannerItemWithFileList) {
  // 检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return false;
  }
  return true;
}

/**
 * 图片上传处理
 */
async function handleImageUpload(options: any, item: BannerItemWithFileList) {
  const { file } = options;
  
  item.uploading = true;
  
  try {
    // 上传图片
    const response = await requestClient.upload<{ path: string }>('/file/upload', { file });
    
    // 获取返回的path
    const path = response?.path || (response as any)?.data?.path;
    if (!path) {
      ElMessage.error('上传失败，未返回文件路径');
      return;
    }

    const imageUrl = getFileUrl(path);

    // 设置图片路径（保存相对路径）
    item.imageUrl = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: 'success' as const,
      uid: Date.now(),
    };
    item.fileList = [fileItem];
    
    ElMessage.success('图片上传成功');
  }
  catch (err: any) {
    console.error('图片上传失败:', err);
    ElMessage.error(err.message || '图片上传失败');
    item.fileList = [];
  }
  finally {
    item.uploading = false;
  }
}

/**
 * 移除图片
 */
function handleImageRemove(item: BannerItemWithFileList) {
  item.imageUrl = '';
  item.fileList = [];
  return true;
}

// 组件挂载时获取数据
onMounted(() => {
  fetchBanner();
});
</script>

<template>
  <div class="banner-container">
    <div class="banner-header">
      <h2>轮播图管理</h2>
      <div class="banner-actions">
        <ElButton type="primary" :loading="saving" @click="handleSubmit">
          保存
        </ElButton>
      </div>
    </div>

    <div v-loading="loading" class="banner-content">
      <div class="banner-items">
        <div
          v-for="(item, index) in formData.items"
          :key="item.key"
          class="banner-item"
        >
          <div class="banner-item-header">
            <span class="banner-item-index">轮播项 {{ index + 1 }}</span>
            <div class="banner-item-actions">
              <ElButton
                size="small"
                :disabled="index === 0"
                @click="moveUp(index)"
              >
                上移
              </ElButton>
              <ElButton
                size="small"
                :disabled="index === formData.items.length - 1"
                @click="moveDown(index)"
              >
                下移
              </ElButton>
              <ElButton
                size="small"
                type="danger"
                @click="removeBannerItem(index)"
              >
                删除
              </ElButton>
            </div>
          </div>

          <div class="banner-item-content">
            <ElForm label-width="100px">
              <ElFormItem label="图片" required>
                <ElUpload
                  :file-list="item.fileList"
                  :limit="1"
                  :before-upload="(file) => beforeImageUpload(file, item)"
                  :http-request="(options) => handleImageUpload(options, item)"
                  :on-remove="() => handleImageRemove(item)"
                  accept="image/*"
                  list-type="picture-card"
                >
                  <template v-if="item.fileList.length === 0">
                    <div class="upload-button">
                      <span v-if="!item.uploading">+</span>
                      <span v-else>上传中...</span>
                    </div>
                  </template>
                </ElUpload>
              </ElFormItem>

              <ElFormItem label="链接地址" required>
                <ElInput
                  v-model="item.linkUrl"
                  placeholder="请输入链接地址"
                  clearable
                />
              </ElFormItem>
            </ElForm>
          </div>
        </div>

        <div class="banner-item-add">
          <ElButton type="primary" @click="addBannerItem">
            添加轮播项
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner-container {
  padding: 24px;
  background: #fff;
  min-height: 100%;
}

.banner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.banner-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.banner-actions {
  display: flex;
  gap: 12px;
}

.banner-content {
  max-width: 1200px;
}

.banner-items {
  width: 100%;
}

.banner-item {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fafafa;
}

.banner-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.banner-item-index {
  font-weight: 600;
  color: #303133;
}

.banner-item-actions {
  display: flex;
  gap: 8px;
}

.banner-item-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.banner-item-add {
  margin-top: 16px;
  padding: 16px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  color: #8c939d;
  cursor: pointer;
}

:deep(.el-upload--picture-card) {
  width: 148px;
  height: 148px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 148px;
  height: 148px;
}
</style>
