import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:dollar-sign',
      order: 10,
      title: '报价管理',
    },
    name: 'Price',
    path: '/price',
    children: [
      {
        name: 'PriceList',
        path: '/price/list',
        component: () => import('#/views/price/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '报价列表',
        },
      },
      {
        name: 'PriceLogs',
        path: '/price/logs',
        component: () => import('#/views/price/logs/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '报价日志',
        },
      },
    ],
  },
];

export default routes;

