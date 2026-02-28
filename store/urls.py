from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/products/', views.product_list, name='product_list'),
    path('api/add-to-cart/', views.add_to_cart, name='add_to_cart'),
]
