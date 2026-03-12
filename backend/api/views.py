from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Category, MenuItem, Vendor, Item, StockEntry, Order, OrderItem
from .serializers import CategorySerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer
from decimal import Decimal
from django.db.models import F, Sum

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

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        item_id = request.data.get('item_id')
        vendor_id = request.data.get('vendor_id')
        quantity = request.data.get('quantity')
        price = request.data.get('price')

        if item_id:
            instance.item = Item.objects.get(id=item_id)
        if vendor_id:
            instance.vendor = Vendor.objects.get(id=vendor_id)
        if quantity is not None:
            instance.quantity = Decimal(quantity)
        if price is not None:
            instance.price = Decimal(price)
            
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
class ReportDashboardView(APIView):
    def get(self, request):
        # We can add date filtering here later based on request.query_params
        orders = Order.objects.filter(status='Completed') # Only count finished orders!

        # 1. Income Metrics
        total_income = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        cash_income = orders.filter(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        online_income = orders.exclude(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # 2. Top Selling Items (Groups OrderItems by name, sums the quantity)
        top_items = OrderItem.objects.filter(order__status='Completed').values(
            name=F('menu_item__name')
        ).annotate(
            total_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price_at_time'))
        ).order_by('-total_sold')[:5] # Top 5 best sellers

        # 3. Low Stock Alerts (Checks MenuItems below 20 quantity)
        low_stock = MenuItem.objects.filter(stock_available__lte=20).values('name', 'stock_available')

        # 4. Recent Order History
        recent_orders = orders.order_by('-created_at')[:100].values(
            'id', 'order_type', 'status', 'total_amount', 'created_at', 'payment_method'
        )
        
        return Response({
            'total_income': total_income,
            'cash_income': cash_income,
            'online_income': online_income,
            'top_items': list(top_items),
            'low_stock': list(low_stock),
            'recent_orders': list(recent_orders)
        })