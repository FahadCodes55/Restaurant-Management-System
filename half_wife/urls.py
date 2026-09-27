from django.urls import path
from . import views

urlpatterns = [

    # Below urls -> homePage & accounts
    path('', views.home, name='home'),
    path('menu/', views.menu, name='menu'),
    path('accounts', views.accounts, name='accounts'),


    # Below url -> Admin Dashboard
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),


    # Below urls -> Menu Editing
    path('menu-edit/<int:id>/', views.menu_edit, name='menu_edit'),
    path('menu-delete/<int:id>/', views.menu_delete, name='menu_delete'),


    # Below urls -> Hiring Employees
    path('hireEmployee/', views.hireEmployee, name='hireEmployee'),
    path('edit-employee/<int:id>/', views.edit_employee, name='edit_employee'),
    path('delete-employee/<int:id>/', views.delete_employee, name='delete_employee'),


    # Below urls -> Tables Management
    path('floor_and_table/',views.floor_and_table, name='floor_and_table'),


    # Below urls -> Kitchen Dashboard
    path('kitchen-dashboard/', views.kitchen_dashboard, name='kitchen_dashboard'),
    path('order-prep/<int:id>/', views.order_start_cooking, name='order_prep'),
    path('order_complete/<int:id>/', views.order_complete, name='order_complete'),


    # Below urls -> Rider Dashboard
    path('rider-dashboard/', views.rider_dashboard, name='rider_dashboard'),
    path('dispatch-order/', views.dispatch_order, name='dispatch_order'),
    path('update-order-status/', views.update_order_status, name='update_order_status'),
    path('update-delivery-status/', views.update_delivery_status, name='update_delivery_status'),


    # Below urls -> Session Cookies & Checkout
    path('save-order-session/', views.save_order_session, name='save_order_session'),
    path('checkout/', views.checkout, name='checkout'),

]