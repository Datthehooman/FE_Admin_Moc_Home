import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: 'Product/ProductList',
                    name: 'ProductList',
                    component: () => import('@/views/Product/ProductList.vue')
                },
                {
                    path: 'Product/Add_Product', // không có dấu /
                    name: 'Add_Product',
                    component: () => import('@/views/Product/Add_Product.vue')
                },

                {
                    path: 'Product/Edit_Product/:id',
                    name: 'Edit_Product',
                    component: () => import('@/views/Product/Edit_Product.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'Category/Categories',
                    name: 'Categories',
                    component: () => import('@/views/Category/Categories.vue')
                },
                {
                    path: 'Category/Add_Category',
                    name: 'Add_Category',
                    component: () => import('@/views/Category/Add_Category.vue')
                },
                {
                    path: 'Category/Edit_Category/:id',
                    name: 'Edit_Category',
                    component: () => import('@/views/Category/Edit_Category.vue')
                },
                {
                    path: '/pages/auth/Login',
                    name: 'Login',
                    component: () => import('@/views/pages/auth/Login.vue')
                },
                {
                    path: '/pages/auth/Register',
                    name: 'Register',
                    component: () => import('@/views/pages/auth/Register.vue')
                },
                {
                    path: 'Voucher/List_Voucher',
                    name: 'List_Voucher',
                    component: () => import('@/views/Voucher/List_Voucher.vue')
                },
                {
                    path: 'Voucher/Add_Voucher',
                    name: 'Add_Voucher',
                    component: () => import('@/views/Voucher/Add_Voucher.vue')
                },
                // {
                //     path: 'Voucher/Edit_Voucher',
                //     name: 'Edit_Voucher',
                //     component: () => import('@/views/Voucher/Edit_Voucher.vue')
                // },
                {
                    path: 'Voucher/Edit_Voucher/:id',
                    name: 'Edit_Voucher',
                    component: () => import('@/views/Voucher/Edit_Voucher.vue')
                },
                {
                    path: 'Order/List_Order',
                    name: 'List_Order',
                    component: () => import('@/views/Order/List_Order.vue')
                },
                {
                    path: 'Order/Detail_Order/:id',
                    name: 'Detail_Order',
                    component: () => import('@/views/Order/Detail_Order.vue')
                },
                {
                    path: '/Customers/List_Customer',
                    name: 'List_Customer',
                    component: () => import('@/views/Customer/List_Customer.vue')
                },
                {
                    path: '/Customers/List_Customer/:id',
                    name: 'Detail_Customer',
                    component: () => import('@/views/Customer/Detail_Customer.vue')
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },

        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

router.beforeEach((to, from, next) => {
    // Utility: read cookie
    function readCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.test');

    const token = isLocal ? readCookie('tokenLocal') : readCookie('token');
    const role = isLocal ? readCookie('roleLocal') : readCookie('role');

    if (!token) {
        window.location.href = 'https://mocfurni.shop/error';
        return;
    }

    if (to.meta.requiresAdmin && role !== '1') {
        window.location.href = 'https://mocfurni.shop/error';
        return;
    }

    next();
});

export default router;
