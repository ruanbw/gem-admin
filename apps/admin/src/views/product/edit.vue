<script lang="ts" setup>
import type { ProductApi } from '#/api/core/product';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElSelect, ElOption, ElUpload } from 'element-plus';
import type { UploadFiles } from 'element-plus';

import {
  createProductApi,
  getProductApi,
  updateProductApi,
} from '#/api';
import { requestClient } from '#/api/request';
import { getFileUrl } from '#/composables/file';

const route = useRoute();
const router = useRouter();

const productId = computed(() => {
  const id = route.query.id;
  return id ? Number(id) : undefined;
});
const isEdit = computed(() => !!productId.value);

// 表单数据
const formData = ref<ProductApi.CreateProductParams>({
  name: '',
  coverImage: '',
  description: '',
  status: 'ONLINE',
  previewImages: [],
});

const loading = ref(false);
const saving = ref(false);
const coverImageUploading = ref(false);
const previewImagesUploading = ref<Record<number, boolean>>({});
const coverImageFileList = ref<UploadFiles>([]);
const previewImagesFileList = ref<UploadFiles>([]);

// 获取商品详情
async function fetchProduct() {
  if (!productId.value) {
    return;
  }
  loading.value = true;
  try {
    const product = await getProductApi(productId.value);
    
    formData.value = {
      name: product.name,
      coverImage: product.coverImage,
      description: product.description || '',
      status: product.status,
      previewImages: product.previewImages || [],
    };

    // 设置封面图文件列表（如果有封面图）
    if (product.coverImage) {
      coverImageFileList.value = [{
        name: 'cover-image',
        url: getFileUrl(product.coverImage),
        status: 'success',
        uid: Date.now(),
      }];
    } else {
      coverImageFileList.value = [];
    }

    // 设置预览图文件列表
    if (product.previewImages && product.previewImages.length > 0) {
      previewImagesFileList.value = product.previewImages.map((image, index) => ({
        name: `preview-image-${index}`,
        url: getFileUrl(image),
        status: 'success' as const,
        uid: Date.now() + index,
      }));
    } else {
      previewImagesFileList.value = [];
    }
  }
  catch (err: any) {
    console.error('获取商品详情失败:', err);
    ElMessage.error(err.message || '获取商品详情失败');
  }
  finally {
    loading.value = false;
  }
}

// 保存商品
async function handleSubmit() {
  if (!formData.value.name?.trim()) {
    ElMessage.warning('请输入商品名称');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value && productId.value) {
      await updateProductApi({ 
        ...formData.value, 
        id: productId.value,
      });
      ElMessage.success('更新商品成功');
    }
    else {
      await createProductApi(formData.value);
      ElMessage.success('创建商品成功');
    }

    // 返回列表页
    router.push('/product');
  }
  catch (err: any) {
    console.error('保存商品失败:', err);
    ElMessage.error(err.message || '保存商品失败');
  }
  finally {
    saving.value = false;
  }
}

// 取消
function handleCancel() {
  router.back();
}

// 组件挂载时获取数据
onMounted(() => {
  if (isEdit.value) {
    fetchProduct();
  }
});

// 封面图上传前的验证
function beforeCoverImageUpload(file: File) {
  // 检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return false;
  }
  return true;
}

// 封面图上传处理（自定义上传）
async function handleCoverImageUpload(options: any) {
  const { file } = options;
  
  coverImageUploading.value = true;
  
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

    // 设置封面图路径（保存相对路径）
    formData.value.coverImage = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: 'success' as const,
      uid: Date.now(),
    };
    coverImageFileList.value = [fileItem];
    
    ElMessage.success('封面图上传成功');
  }
  catch (err: any) {
    console.error('封面图上传失败:', err);
    ElMessage.error(err.message || '封面图上传失败');
    coverImageFileList.value = [];
  }
  finally {
    coverImageUploading.value = false;
  }
}

// 移除封面图
function handleCoverImageRemove() {
  formData.value.coverImage = '';
  coverImageFileList.value = [];
  return true;
}

// 预览图上传前的验证
function beforePreviewImageUpload(file: File) {
  // 检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return false;
  }
  return true;
}

// 预览图上传处理（自定义上传）
async function handlePreviewImageUpload(options: any) {
  const { file } = options;
  
  const uploadIndex = previewImagesFileList.value.length;
  previewImagesUploading.value[uploadIndex] = true;
  
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

    // 添加到预览图列表（保存相对路径）
    if (!formData.value.previewImages) {
      formData.value.previewImages = [];
    }
    formData.value.previewImages.push(path);

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: 'success' as const,
      uid: Date.now() + uploadIndex,
    };
    previewImagesFileList.value.push(fileItem);
    
    ElMessage.success('预览图上传成功');
  }
  catch (err: any) {
    console.error('预览图上传失败:', err);
    ElMessage.error(err.message || '预览图上传失败');
  }
  finally {
    previewImagesUploading.value[uploadIndex] = false;
  }
}

// 移除预览图
function handlePreviewImageRemove(file: UploadFiles[number]) {
  const index = previewImagesFileList.value.findIndex(item => item.uid === file.uid);
  if (index !== -1) {
    previewImagesFileList.value.splice(index, 1);
    if (formData.value.previewImages) {
      formData.value.previewImages.splice(index, 1);
    }
  }
  return true;
}
</script>

<template>
  <div class="product-edit-container">
    <div class="product-edit-header">
      <h2>{{ isEdit ? '编辑商品' : '添加商品' }}</h2>
      <div class="product-edit-actions">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">
          保存
        </ElButton>
      </div>
    </div>

    <div v-loading="loading" class="product-edit-content">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="商品名称" required>
          <ElInput
            v-model="formData.name"
            placeholder="请输入商品名称"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="封面图">
          <ElUpload
            :file-list="coverImageFileList"
            :limit="1"
            :before-upload="beforeCoverImageUpload"
            :http-request="handleCoverImageUpload"
            :on-remove="handleCoverImageRemove"
            accept="image/*"
            list-type="picture-card"
          >
            <template v-if="coverImageFileList.length === 0">
              <div class="upload-button">
                <span v-if="!coverImageUploading">+</span>
                <span v-else>上传中...</span>
              </div>
            </template>
          </ElUpload>
        </ElFormItem>

        <ElFormItem label="商品描述">
          <ElInput
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
            maxlength="500"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="状态" required>
          <ElSelect v-model="formData.status" placeholder="请选择状态">
            <ElOption label="上架" value="ONLINE" />
            <ElOption label="下架" value="OFFLINE" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="预览图">
          <ElUpload
            :file-list="previewImagesFileList"
            :before-upload="beforePreviewImageUpload"
            :http-request="handlePreviewImageUpload"
            :on-remove="handlePreviewImageRemove"
            accept="image/*"
            list-type="picture-card"
          >
            <div class="upload-button">
              <span>+</span>
            </div>
          </ElUpload>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<style scoped>
.product-edit-container {
  padding: 24px;
  background: #fff;
  min-height: 100%;
}

.product-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.product-edit-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.product-edit-actions {
  display: flex;
  gap: 12px;
}

.product-edit-content {
  max-width: 1200px;
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

