from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Category, MenuItem, InventoryItem
from .serializers import CategorySerializer, MenuItemSerializer, InventoryItemSerializer
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



class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('-created_at')
    serializer_class = InventoryItemSerializer

    def create(self, request, *args, **kwargs):
        name = request.data.get('name')
        vendor_name = request.data.get('vendor_name', 'General Vendor')
        incoming_qty = Decimal(request.data.get('qty', 0))

        # Check if this exact item from this exact vendor already exists
        existing_item = InventoryItem.objects.filter(
            name__iexact=name, 
            vendor_name__iexact=vendor_name
        ).first()

        if existing_item:
            # LOGIC: 150kg + 40kg = 190kg
            existing_item.qty += incoming_qty
            # Optional: Update price to the newest price
            existing_item.price = request.data.get('price', existing_item.price) 
            existing_item.save()
            return Response({'message': 'Stock updated successfully', 'qty': existing_item.qty}, status=status.HTTP_200_OK)
        
        # If it doesn't exist, create a brand new row normally
        return super().create(request, *args, **kwargs)