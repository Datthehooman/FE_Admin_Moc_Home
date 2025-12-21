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
                icon: 'pi pi-fw pi-box', // để sản phẩm giữ box
                items: [
                    {
                        label: 'Danh sách sản phẩm',
                        icon: 'pi pi-fw pi-list', // đổi thành list
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
                        icon: 'pi pi-fw pi-list', // list danh mục
                        to: '/Category/Categories'
                    },
                    {
                        label: 'Thêm danh mục',
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
                icon: 'pi pi-fw pi-ticket', // đổi icon voucher thành ticket
                items: [
                    {
                        label: 'Danh sách mã giảm giá',
                        icon: 'pi pi-fw pi-list',
                        to: '/Voucher/List_Voucher'
                    },
                    {
                        label: 'Thêm mã giảm giá',
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
                to: '/Order/List_Order'
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
                        icon: 'pi pi-fw pi-file-edit', // file-edit trực quan hơn
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
                        icon: 'pi pi-fw pi-list', // đổi thành list
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
        items: [{ label: 'Đánh Giá', icon: 'pi pi-fw pi-star', to: '/Review/List_Review' }]
    },
    {
        items: [
            {
                label: 'Kho',
                icon: 'pi pi-fw pi-warehouse',
                items: [
                    {
                        label: 'Báo cáo & lịch sử kho',
                        icon: 'pi pi-fw pi-book',
                        items: [
                            {
                                label: 'Báo cáo kho',
                                icon: 'pi pi-fw pi-list',
                                to: '/Inventory/Report'
                            },
                            {
                                label: 'Tồn kho thấp',
                                icon: 'pi pi-fw pi-exclamation-triangle',
                                to: '/Inventory/Low_Stock_Alert'
                            },
                            {
                                label: 'Lịch sử kho',
                                icon: 'pi pi-fw pi-history',
                                to: '/Inventory/History'
                            }
                        ]
                    },
                    {
                        label: 'Xuất/nhập kho',
                        icon: 'pi pi-fw pi-arrow-right-arrow-left',
                        items: [
                            {
                                label: 'Nhập kho',
                                icon: 'pi pi-fw pi-file-import',
                                to: '/Inventory/Import'
                            },
                            {
                                label: 'Xuất kho',
                                icon: 'pi pi-fw pi-file-export',
                                to: '/Inventory/Export'
                            },
                            {
                                label: 'Điều chỉnh kho',
                                icon: 'pi pi-fw pi-file-edit',
                                to: '/Inventory/Adjust'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        items: [{ label: 'Khuyến Mãi', icon: 'pi pi-fw pi-gift', to: '/Promotions/List' }]
    },
    {
        items: [{ label: 'Khách Hàng', icon: 'pi pi-fw pi-users', to: '/Customers/List_Customer' }]
    },
    {
        items: [{ label: 'Tin nhắn', icon: 'pi pi-fw pi-comments', to: '/Chat/Chats' }] // đổi users → comments
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
