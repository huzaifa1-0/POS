from rest_framework import serializers
from .models import Category, MenuItem, Recipe, Vendor, Item, StockEntry, Branch, Expense

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class StockEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StockEntry
        fields = '__all__'
        depth = 1

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff_member.first_name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount', 'description', 'date', 'staff_member', 'staff_name', 'created_at']