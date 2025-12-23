<script setup lang="ts">
import { useVbenForm } from '@vben/common-ui';
import { ElButton } from 'element-plus';
import { nextTick, watch } from 'vue';

import type { AppletApi } from '#/api/core/applet';

interface Props {
    modelValue: AppletApi.FrequentlyAskedQuestion[];
}

interface Emits {
    (e: 'update:modelValue', value: AppletApi.FrequentlyAskedQuestion[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 将 frequentlyAskedQuestions 数组转换为表单 schema
function buildFrequentlyAskedQuestionSchema(questions: AppletApi.FrequentlyAskedQuestion[]) {
    const schema: any[] = [];
    questions.forEach((_, index) => {
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入问题',
                type: 'textarea',
                class: 'w-full',
            },
            fieldName: `frequentlyAskedQuestion.${index}.question`,
            label: `问题 ${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入答案',
                type: 'textarea',
                class: 'w-full',
            },
            fieldName: `frequentlyAskedQuestion.${index}.answer`,
            label: `答案 ${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        // 添加删除按钮字段（使用插槽渲染）
        schema.push({
            component: 'div',
            fieldName: `delete_question_${index}`,
            label: '',
            formItemClass: 'col-span-1 flex items-end',
            hideLabel: true,
        });
    });
    return schema;
}

// 将表单值转换为 API 需要的格式 - 常见问题
function convertFrequentlyAskedQuestionToApi(values: Record<string, any>): AppletApi.FrequentlyAskedQuestion[] {
    const questions: AppletApi.FrequentlyAskedQuestion[] = [];

    if (values.frequentlyAskedQuestion && typeof values.frequentlyAskedQuestion === 'object') {
        // 处理嵌套对象结构
        const questionObj = values.frequentlyAskedQuestion;
        const indices = Object.keys(questionObj)
            .map(key => parseInt(key, 10))
            .filter(num => !isNaN(num))
            .sort((a, b) => a - b);

        indices.forEach(index => {
            const question = questionObj[index];
            if (question && typeof question === 'object') {
                const questionText = question.question;
                const answer = question.answer;
                if (questionText !== undefined && answer !== undefined) {
                    questions.push({
                        question: String(questionText || ''),
                        answer: String(answer || ''),
                    });
                }
            }
        });
    } else {
        // 处理扁平结构（向后兼容）
        const questionMap = new Map<number, Partial<AppletApi.FrequentlyAskedQuestion>>();

        Object.keys(values).forEach((key) => {
            const match = key.match(/^frequentlyAskedQuestion\.(\d+)\.(question|answer)$/);
            if (match) {
                const index = parseInt(match[1] || '0', 10);
                const field = (match[2] || '') as 'question' | 'answer';
                if (field && (field === 'question' || field === 'answer')) {
                    if (!questionMap.has(index)) {
                        questionMap.set(index, {});
                    }
                    const question = questionMap.get(index)!;
                    question[field] = values[key];
                }
            }
        });

        // 转换为数组并按索引排序
        Array.from(questionMap.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([, question]) => {
                if (question.question !== undefined && question.answer !== undefined) {
                    questions.push({
                        question: String(question.question || ''),
                        answer: String(question.answer || ''),
                    });
                }
            });
    }

    return questions;
}

// 常见问题表单
let isUpdatingFromProps = false;

const [FrequentlyAskedQuestionForm, FrequentlyAskedQuestionFormApi] = useVbenForm({
    commonConfig: {
        componentProps: {
            class: 'w-full',
            position: 'top',
        },
    },
    scrollToFirstError: true,
    layout: 'horizontal',
    schema: [],
    wrapperClass: 'grid-cols-3',
    showDefaultActions: false,
    handleValuesChange: async (values) => {
        // 避免循环更新
        if (isUpdatingFromProps) {
            return;
        }
        const questions = convertFrequentlyAskedQuestionToApi(values || {});
        emit('update:modelValue', questions);
    },
});

// 监听 props 变化，更新表单
watch(() => props.modelValue, async (newValue) => {
    // 避免循环更新
    if (isUpdatingFromProps) {
        return;
    }
    if (!newValue || newValue.length === 0) {
        FrequentlyAskedQuestionFormApi.setState({ schema: [] });
        return;
    }

    // 构建表单 schema
    const frequentlyAskedQuestionSchema = buildFrequentlyAskedQuestionSchema(newValue);
    FrequentlyAskedQuestionFormApi.setState({ schema: frequentlyAskedQuestionSchema });

    // 等待 DOM 更新完成
    await nextTick();
    await nextTick();

    // 设置表单初始值
    const frequentlyAskedQuestionValues: Record<string, any> = {
        frequentlyAskedQuestion: {} as Record<number, { question: string; answer: string }>,
    };
    newValue.forEach((question, index) => {
        if (!frequentlyAskedQuestionValues.frequentlyAskedQuestion[index]) {
            frequentlyAskedQuestionValues.frequentlyAskedQuestion[index] = {} as { question: string; answer: string };
        }
        frequentlyAskedQuestionValues.frequentlyAskedQuestion[index].question = question.question;
        frequentlyAskedQuestionValues.frequentlyAskedQuestion[index].answer = question.answer;
    });
    isUpdatingFromProps = true;
    await FrequentlyAskedQuestionFormApi.setValues(frequentlyAskedQuestionValues);
    await nextTick();
    isUpdatingFromProps = false;
}, { immediate: true });

// 添加常见问题项
function handleAddQuestion() {
    const newList = [...props.modelValue, { question: '', answer: '' }];
    emit('update:modelValue', newList);
}

// 删除常见问题项
function handleDeleteQuestion(index: number) {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
}

// 暴露方法供父组件调用
defineExpose({
    getValues: async () => {
        const values = await FrequentlyAskedQuestionFormApi.getValues();
        return convertFrequentlyAskedQuestionToApi(values || {});
    },
});
</script>

<template>
    <div>
        <div v-if="modelValue.length === 0" class="text-center py-8 text-gray-400">
            添加常见问题
        </div>
        <FrequentlyAskedQuestionForm v-else>
            <template v-for="(_, index) in modelValue" :key="`delete_question_${index}`"
                #[`delete_question_${index}`]>
                <div class="flex items-end h-full pb-1">
                    <ElButton type="danger" size="small" @click="handleDeleteQuestion(index)">
                        删除
                    </ElButton>
                </div>
            </template>
        </FrequentlyAskedQuestionForm>
        <div class="mt-4">
            <ElButton type="primary" @click="handleAddQuestion">
                添加问题
            </ElButton>
        </div>
    </div>
</template>

<style scoped></style>

