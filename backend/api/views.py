from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Category, MenuItem, Vendor, Item, StockEntry
from .serializers import CategorySerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer
from decimal import Decimal

# --- NEW: Registration View ---
class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password or not name:
            return Response({'error': 'Please provide name, email, and password'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=email).exists():
            return Response({'error': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create user (setting username=email so login works smoothly)
        user = User.objects.create(
            username=email, 
            email=email,
            first_name=name,
            password=make_password(password)
        )
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)

# --- EXISTING POS VIEWS ---
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer



class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class StockEntryViewSet(viewsets.ModelViewSet):
    queryset = StockEntry.objects.all().order_by('-created_at')
    serializer_class = StockEntrySerializer

    # We override create to handle the nested data from React
    def create(self, request, *args, **kwargs):
        item_id = request.data.get('item_id')
        vendor_id = request.data.get('vendor_id')
        quantity = request.data.get('quantity')
        price = request.data.get('price')

        # Create the stock entry
        item = Item.objects.get(id=item_id)
        vendor = Vendor.objects.get(id=vendor_id)
        
        entry = StockEntry.objects.create(
            item=item,
            vendor=vendor,
            quantity=Decimal(quantity),
            price=Decimal(price)
        )
        
        serializer = self.get_serializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)