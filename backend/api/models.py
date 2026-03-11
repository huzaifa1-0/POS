from django.db import models
from django.contrib.auth.models import AbstractUser

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='menu_images/', blank=True, null=True)
    stock_available = models.IntegerField(default=100)

    def __str__(self):
        return self.name

class Order(models.Model):
    ORDER_TYPES = (('Dine-In', 'Dine-In'), ('Takeaway', 'Takeaway'), ('Delivery', 'Delivery'))
    table_number = models.CharField(max_length=10, blank=True, null=True)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES, default='Dine-In')
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)



class Vendor(models.Model):
    name = models.CharField(max_length=200, unique=True)
    
    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=200, unique=True)
    unit = models.CharField(max_length=50) # e.g., KG, Litre
    
    def __str__(self):
        return f"{self.name} ({self.unit})"

class StockEntry(models.Model):
    item = models.ForeignKey(Item, related_name='stock_entries', on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, related_name='stock_entries', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price per unit at the time of entry
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} {self.item.unit} of {self.item.name} from {self.vendor.name}"
    

