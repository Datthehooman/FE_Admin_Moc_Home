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
                    }
                ]
            }
        ]
    },
    {
        items: [
            {
                label: 'Danh Mục',
                icon: 'pi pi-fw pi-tags',
                items: [
                    {
                        label: 'Danh sách danh mục',
                        icon: 'pi pi-fw pi-box',
                        to: '/Category/Categories'
                    },
                    {
                        label: 'Thêm sản danh mục',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Category/Add_Category'
                    }
                ]
            }
        ]
    },
    {
        items: [
            {
                label: 'Mã giảm giá',
                icon: 'pi pi-fw pi-tags',
                items: [
                    {
                        label: 'Danh sách mã giảm giá',
                        icon: 'pi pi-fw pi-box',
                        to: '/Voucher/List_Voucher'
                    },
                    {
                        label: 'Thêm sản mã giảm giá',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Voucher/Add_Voucher'
                    }
                ]
            }
        ]
    },
    {
        items: [
            {
                label: 'Đơn Hàng',
                icon: 'pi pi-fw pi-shopping-cart',
                items: [
                    {
                        label: 'Danh sách đơn hàng',
                        icon: 'pi pi-fw pi-box',
                        to: '/Order/List_Order'
                    }
                ]
            }
        ]
    },
    {
        items: [
            {
                label: 'Bài Viết',
                icon: 'pi pi-fw pi-pencil',
                items: [
                    {
                        label: 'Danh sách bài viết',
                        icon: 'pi pi-fw pi-file',
                        to: '/Article/List_Article'
                    },
                    {
                        label: 'Thêm bài viết',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Article/Add_Article'
                    }
                ]
            }
        ]
    },
    {
        items: [
            {
                label: 'Danh Mục Bài Viết',
                icon: 'pi pi-fw pi-folder',
                items: [
                    {
                        label: 'Danh sách danh mục bài viết',
                        icon: 'pi pi-fw pi-box',
                        to: '/Article_Category/List_Article_Category'
                    },
                    {
                        label: 'Thêm danh mục bài viết',
                        icon: 'pi pi-fw pi-plus',
                        to: '/Article_Category/Add_Article_Category'
                    }
                ]
            }
        ]
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
