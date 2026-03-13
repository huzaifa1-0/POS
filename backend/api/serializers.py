from rest_framework import serializers
from .models import Category, MenuItem, Recipe, Vendor, Item, StockEntry

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
    # depth = 1 allows us to get the actual item and vendor details in the API response
    # instead of just their ID numbers, which is very helpful for React.
    class Meta:
        model = StockEntry
        fields = '__all__'
        depth = 1


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = '__all__'