<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { ElButton, ElCollapse, ElCollapseItem, ElMessage } from 'element-plus';
import { onMounted, ref, watch } from 'vue';

import { getAppletConfigApi, updateAppletConfigApi } from '#/api/core';
import type { AppletApi } from '#/api/core/applet';

import FrequentlyAskedQuestionForm from './components/FrequentlyAskedQuestionForm.vue';
import NotificationForm from './components/NotificationForm.vue';
import RecyclingProcessForm, { type RecyclingProcess } from './components/RecyclingProcessForm.vue';
import { type Notification } from './components/NotificationForm.vue';

const recyclingProcessList = ref<RecyclingProcess[]>([]);
const notificationList = ref<Notification[]>([]);
const frequentlyAskedQuestionList = ref<AppletApi.FrequentlyAskedQuestion[]>([]);

// 保存原始数据用于比较
const originalRecyclingProcessList = ref<RecyclingProcess[]>([]);
const originalNotificationList = ref<Notification[]>([]);
const originalFrequentlyAskedQuestionList = ref<AppletApi.FrequentlyAskedQuestion[]>([]);

// 是否有内容变化
const hasChanges = ref(false);

// 手风琴展开项（默认只展开第一个，使用 accordion 模式每次只能展开一个）
const activeNames = ref<string>('');

// 组件引用
const recyclingProcessFormRef = ref<InstanceType<typeof RecyclingProcessForm>>();
const notificationFormRef = ref<InstanceType<typeof NotificationForm>>();
const frequentlyAskedQuestionFormRef = ref<InstanceType<typeof FrequentlyAskedQuestionForm>>();


// 深度比较两个值是否相等
function deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

// 检查是否有变化
function checkChanges() {
    const hasRecyclingProcessChanged = !deepEqual(recyclingProcessList.value, originalRecyclingProcessList.value);
    const hasNotificationChanged = !deepEqual(notificationList.value, originalNotificationList.value);
    const hasFrequentlyAskedQuestionChanged = !deepEqual(frequentlyAskedQuestionList.value, originalFrequentlyAskedQuestionList.value);
    
    hasChanges.value = hasRecyclingProcessChanged || hasNotificationChanged || hasFrequentlyAskedQuestionChanged;
}

// 监听数据变化
watch([recyclingProcessList, notificationList, frequentlyAskedQuestionList], () => {
    checkChanges();
}, { deep: true });

// 统一提交处理
async function handleSubmitAll() {
    // 获取三个表单的值
    const recyclingProcess = recyclingProcessFormRef.value
        ? await recyclingProcessFormRef.value.getValues()
        : [];
    const notifications = notificationFormRef.value
        ? await notificationFormRef.value.getValues()
        : [];
    const frequentlyAskedQuestions = frequentlyAskedQuestionFormRef.value
        ? await frequentlyAskedQuestionFormRef.value.getValues()
        : [];

    await updateAppletConfigApi({
        recyclingProcesss: recyclingProcess,
        notifications: notifications,
        frequentlyAskedQuestions: frequentlyAskedQuestions,
    });
    ElMessage.success('配置更新成功');
    // 重新获取配置以同步数据
    await fetchConfig();
    // 保存成功后重置变化状态
    hasChanges.value = false;
}

// 获取配置
async function fetchConfig() {
    const config = await getAppletConfigApi();
    const recyclingProcesss = config.recyclingProcesss || [];
    const notifications = config.notifications || [];
    const frequentlyAskedQuestions = config.frequentlyAskedQuestions || [];
    
    // 更新数据
    recyclingProcessList.value = recyclingProcesss;
    notificationList.value = notifications;
    frequentlyAskedQuestionList.value = frequentlyAskedQuestions;
    
    // 保存原始数据（深拷贝）
    originalRecyclingProcessList.value = JSON.parse(JSON.stringify(recyclingProcesss));
    originalNotificationList.value = JSON.parse(JSON.stringify(notifications));
    originalFrequentlyAskedQuestionList.value = JSON.parse(JSON.stringify(frequentlyAskedQuestions));
    
    // 重置变化状态
    hasChanges.value = false;
}

// 组件挂载时获取配置
onMounted(() => {
    fetchConfig();
});
</script>

<template>
    <Page>
        <div class="p-2">
            <ElCollapse v-model="activeNames" accordion class="applet-config-collapse">
                <ElCollapseItem name="recyclingProcess" title="回收流程说明">
                    <div class="px-4 pb-4">
                        <RecyclingProcessForm
                            ref="recyclingProcessFormRef"
                            v-model="recyclingProcessList"
                        />
                    </div>
                </ElCollapseItem>
                <ElCollapseItem name="notification" title="通知配置">
                    <div class="px-4 pb-4">
                        <NotificationForm
                            ref="notificationFormRef"
                            v-model="notificationList"
                        />
                    </div>
                </ElCollapseItem>
                <ElCollapseItem name="frequentlyAskedQuestion" title="常见问题">
                    <div class="px-4 pb-4">
                        <FrequentlyAskedQuestionForm
                            ref="frequentlyAskedQuestionFormRef"
                            v-model="frequentlyAskedQuestionList"
                        />
                    </div>
                </ElCollapseItem>
            </ElCollapse>
        </div>
        <div v-if="hasChanges" class="mt-4 flex justify-end">
            <ElButton type="primary" @click="handleSubmitAll">
                保存配置
            </ElButton>
        </div>
    </Page>
</template>

<style scoped>
:deep(.el-collapse-item__title) {
    padding-left: 10px;
}
</style>

