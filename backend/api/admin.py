from django.contrib import admin
from .models import Category, MenuItem, Order, OrderItem, StockEntry, Vendor, Item

admin.site.register(Category)
admin.site.register(MenuItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Vendor)
admin.site.register(Item)
admin.site.register(StockEntry)