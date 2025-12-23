import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shopping-bag',
      order: 20,
      title: '订单管理',
    },
    name: 'Order',
    path: '/order',
    children: [
      {
        name: 'OrderList',
        path: '/order/list',
        component: () => import('#/views/order/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '订单列表',
        },
      },
    ],
  },
];

export default routes;



