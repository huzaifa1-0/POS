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

    payment_method = models.CharField(max_length=50, default='Cash')
    created_at = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)
    # NEW FIELD: Store the snapshot of the cost at the time of sale
    cost_at_time = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)



class Vendor(models.Model):
    PAYMENT_CHOICES = (
        ('Cash', 'Cash'),
        ('JazzCash', 'JazzCash'),
        ('EasyPaisa', 'EasyPaisa'),
        ('Bank Account', 'Bank Account'),
    )
    
    name = models.CharField(max_length=200, unique=True)
    # New Fields:
    address = models.TextField(blank=True, null=True)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_CHOICES, default='Cash')
    payment_account = models.CharField(max_length=200, blank=True, null=True) # E.g., phone number or IBAN
    
    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=200, unique=True)
    unit = models.CharField(max_length=50) # e.g., KG, Litre
    image = models.ImageField(upload_to='item_images/', blank=True, null=True)
    
    # --- CHANGE THESE 3 LINES TO decimal_places=4 ---
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=4, default=5.0000)
    
    def __str__(self):
        return f"{self.name} ({self.unit})"
    

class Recipe(models.Model):
    menu_item = models.ForeignKey(MenuItem, related_name='recipe_items', on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Item, on_delete=models.CASCADE)
    # Use 4 decimal places for precise measurements (e.g., 0.005 kg of masala)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=4)

    def __str__(self):
        return f"{self.quantity_required} {self.ingredient.unit} of {self.ingredient.name} for {self.menu_item.name}"
    


class InventoryLog(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity_change = models.DecimalField(max_digits=10, decimal_places=4)
    reason = models.CharField(max_length=255) # e.g., "Order #15", "Stock Purchase", "Wastage"
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.name}: {self.quantity_change} ({self.reason})"
    



class StockEntry(models.Model):
    item = models.ForeignKey(Item, related_name='stock_entries', on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, related_name='stock_entries', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price per unit at the time of entry
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} {self.item.unit} of {self.item.name} from {self.vendor.name}"
    

