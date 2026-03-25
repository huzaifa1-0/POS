from django.db import models
from django.contrib.auth.models import User

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
    branch = models.ForeignKey('Branch', on_delete=models.SET_NULL, null=True, blank=True)
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
    cost_at_time = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class Vendor(models.Model):
    PAYMENT_CHOICES = (
        ('Cash', 'Cash'),
        ('JazzCash', 'JazzCash'),
        ('EasyPaisa', 'EasyPaisa'),
        ('Bank Account', 'Bank Account'),
    )
    name = models.CharField(max_length=200, unique=True)
    address = models.TextField(blank=True, null=True)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_CHOICES, default='Cash')
    payment_account = models.CharField(max_length=200, blank=True, null=True)
    
    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=200, unique=True)
    unit = models.CharField(max_length=50)
    image = models.ImageField(upload_to='item_images/', blank=True, null=True)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=4, default=5.0000)
    
    def __str__(self):
        return f"{self.name} ({self.unit})"

class Recipe(models.Model):
    menu_item = models.ForeignKey(MenuItem, related_name='recipe_items', on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=4)

    def __str__(self):
        return f"{self.quantity_required} {self.ingredient.unit} of {self.ingredient.name} for {self.menu_item.name}"

class InventoryLog(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity_change = models.DecimalField(max_digits=10, decimal_places=4)
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.name}: {self.quantity_change} ({self.reason})"

class StockEntry(models.Model):
    item = models.ForeignKey(Item, related_name='stock_entries', on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, related_name='stock_entries', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} {self.item.unit} of {self.item.name} from {self.vendor.name}"

class Branch(models.Model):
    name = models.CharField(max_length=200, unique=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('cashier', 'Cashier'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Resource(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name

class Permission(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='permissions')
    action = models.CharField(max_length=50)
    permission_key = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.permission_key

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.ManyToManyField(Permission, related_name='roles')

    def __str__(self):
        return self.name

class Expense(models.Model):
    EXPENSE_CATEGORIES = (
        ('Utility', 'Utility Bill'),
        ('Staff', 'Staff Payment'),
        ('Misc', 'Miscellaneous'),
    )
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateField()
    staff_member = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"