import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ServiceDashboard from '@/views/ServiceDashboard.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/service'
        },
        {
            path: '/',
            component: MainLayout,
            children: [
                {
                    path: 'service',
                    name: 'service',
                    component: ServiceDashboard,
                    meta: { title: '服务管理' }
                },
                {
                    path: 'service/medical',
                    name: 'medical-service',
                    component: () => import('@/views/service/MedicalService.vue'),
                    meta: { title: '体检服务管理' }
                },
                {
                    path: 'service/medical-schedule',
                    name: 'medical-schedule',
                    component: () => import('@/views/service/MedicalSchedule.vue'),
                    meta: { title: '体检档期管理' }
                },
                {
                    path: 'service/medical-branch',
                    name: 'medical-branch',
                    component: () => import('@/views/service/MedicalBranch.vue'),
                    meta: { title: '体检分院管理' }
                },
                {
                    path: 'service/hotel',
                    name: 'hotel-service',
                    component: () => import('@/views/service/HotelService.vue'),
                    meta: { title: '房型管理' }
                },
                {
                    path: 'service/booking',
                    name: 'booking-service',
                    component: () => import('@/views/service/BookingService.vue'),
                    meta: { title: '预定服务类管理' }
                },
                {
                    path: 'service/hotel/room-status',
                    name: 'room-status',
                    component: () => import('@/views/service/RoomStatus.vue'),
                    meta: { title: '房态管控' }
                },
                // Order Management
                {
                    path: 'order',
                    redirect: '/order/hotel',
                },
                {
                    path: 'order/hotel',
                    name: 'order-hotel',
                    component: () => import('@/views/order/HotelOrder.vue'),
                    meta: { title: '酒店服务订单' }
                },
                {
                    path: 'order/medical',
                    name: 'order-medical',
                    component: () => import('@/views/order/MedicalOrder.vue'),
                    meta: { title: '体检服务订单' }
                },
                {
                    path: 'order/booking',
                    name: 'order-booking',
                    component: () => import('@/views/order/BookingOrder.vue'),
                    meta: { title: '预定服务订单' }
                },
                // Placeholders for other modules
                {
                    path: 'product',
                    name: 'product',
                    component: { render: () => '商品管理' },
                    meta: { title: '商品管理' }
                },
                {
                    path: 'user',
                    name: 'user',
                    component: () => import('@/views/merchant/UserManage.vue'),
                    meta: { title: '用户管理' }
                },
                {
                    path: 'profile',
                    name: 'profile',
                    component: () => import('@/views/merchant/UserProfile.vue'),
                    meta: { title: '个人中心' }
                },
                {
                    path: 'merchant-info',
                    name: 'merchant-info',
                    component: () => import('@/views/merchant/MerchantInfo.vue'),
                    meta: { title: '商家信息管理' }
                },
                {
                    path: 'message',
                    name: 'message',
                    component: () => import('@/views/message/MessageCenter.vue'),
                    meta: { title: '消息中心' }
                }
            ]
        }
    ]
})

export default router
