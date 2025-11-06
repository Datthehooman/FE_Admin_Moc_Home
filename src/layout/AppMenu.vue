<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        items: [{ label: 'Tổng Quan', icon: 'pi pi-fw pi-home', to: '/' }]
    },

    {
        items: [
            {
                label: 'Sản phẩm',
                icon: 'pi pi-fw pi-box',
                items: [
                    {
                        label: 'Danh sách sản phẩm',
                        icon: 'pi pi-fw pi-box',
                        to: '/Product/ProductList'
                    },
                     {
                        label: 'Thêm sản phẩm',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Product/Add_Product'
                    },
                       {
                        label: 'Sửa sản phẩm',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Product/Edit_Product'
                    }
                ]
            },

        ]
    },

    {
        items: [{ label: 'Danh Mục', icon: 'pi pi-fw pi-tags', to: '/Category/List' }]
    },
    {
        items: [{ label: 'Đơn Hàng', icon: 'pi pi-fw pi-shopping-cart', to: '/Orders/List' }]
    },
    {
        items: [{ label: 'Bài Viết', icon: 'pi pi-fw pi-pencil', to: '/Posts/List' }]
    },
    {
        items: [{ label: 'Đánh Giá', icon: 'pi pi-fw pi-star', to: '/Reviews/List' }]
    },
    {
        items: [{ label: 'Khuyến Mãi', icon: 'pi pi-fw pi-gift', to: '/Promotions/List' }]
    },
    {
        items: [{ label: 'Khách Hàng', icon: 'pi pi-fw pi-users', to: '/Customers/List' }]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="i">
            <app-menu-item :item="item" :index="i"></app-menu-item>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
