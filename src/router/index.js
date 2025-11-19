import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
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

router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();

    // Public routes that do NOT require login
    const publicRoutes = ['login', 'Login', 'Register', 'landing', 'notfound'];
    const isPublic = publicRoutes.includes(to.name);

    // Not logged in → go to login
    if (!auth.isAuthenticated && !isPublic) {
        return next('/auth/login');
    }

    // If logged in but user info not loaded → fetch
    if (auth.isAuthenticated && !auth.user) {
        try {
            await auth.fetchUser();
        } catch (error) {
            // Token expired or invalid → logout → redirect login
            auth.clearAuth();
            return next('/auth/login');
        }
    }

    next();
});

export default router;
