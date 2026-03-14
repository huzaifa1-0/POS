from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Category, MenuItem, Vendor, Item, StockEntry, Order, OrderItem, Recipe, InventoryLog
from django.db import transaction
from django.core.exceptions import ValidationError
from .serializers import CategorySerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer, RecipeSerializer
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

    @transaction.atomic

    # We override create to handle the nested data from React
    def create(self, request, *args, **kwargs):
        item_id = request.data.get('item_id')
        vendor_id = request.data.get('vendor_id')
        quantity = Decimal(str(request.data.get('quantity')))
        price = Decimal(str(request.data.get('price'))) # Price per unit at purchase

        item = Item.objects.get(id=item_id)
        vendor = Vendor.objects.get(id=vendor_id)
        
        # --- CALCULATE WEIGHTED AVERAGE COST (WAC) ---
        total_value_on_hand = item.quantity_on_hand * item.cost_per_unit
        new_purchase_value = quantity * price
        new_total_quantity = item.quantity_on_hand + quantity
        
        if new_total_quantity > 0:
             # WAC Formula: (Old Value + New Value) / Total Quantity
            item.cost_per_unit = (total_value_on_hand + new_purchase_value) / new_total_quantity
            
        item.quantity_on_hand = new_total_quantity
        item.save()

        # Create the stock entry
        entry = StockEntry.objects.create(
            item=item, vendor=vendor, quantity=quantity, price=price
        )
        
        # --- NEW: LOG THE INVENTORY ADDITION ---
        InventoryLog.objects.create(
            item=item,
            quantity_change=quantity,
            reason=f"Stock Purchase - Entry #{entry.id} from {vendor.name}"
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
        orders = Order.objects.filter(status='Completed')
        order_items = OrderItem.objects.filter(order__in=orders)

        total_income = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        cash_income = orders.filter(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        online_income = orders.exclude(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # --- NEW: Calculate True Profit based on Historical Cost Snapshots ---
        total_cogs = order_items.aggregate(Sum('cost_at_time'))['cost_at_time__sum'] or 0
        net_profit = total_income - total_cogs
        
        # --- UPDATED: Low Stock Alerts based on raw ingredients, not menu items! ---
        # Filters where stock is less than or equal to the custom threshold
        low_stock = Item.objects.filter(quantity_on_hand__lte=F('low_stock_threshold')).values('name', 'quantity_on_hand', 'unit')

        # Top items & Recent orders logic remains the same
        top_items = OrderItem.objects.filter(order__status='Completed').values(
            name=F('menu_item__name')
        ).annotate(
            total_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price_at_time'))
        ).order_by('-total_sold')[:5]

        recent_orders = orders.order_by('-created_at')[:100].values(
            'id', 'order_type', 'status', 'total_amount', 'created_at', 'payment_method'
        )
        
        return Response({
            'total_income': total_income,
            'cogs': total_cogs,             # Pass to React
            'net_profit': net_profit,       # Pass to React
            'cash_income': cash_income,
            'online_income': online_income,
            'top_items': list(top_items),
            'low_stock': list(low_stock),
            'recent_orders': list(recent_orders)
        })


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    
    @transaction.atomic  # CRITICAL: Ensures all db operations succeed or fail together
    def create(self, request, *args, **kwargs):
        data = request.data
        
        # 1. Create the Main Order
        order = Order.objects.create(
            table_number=data.get('table_number'),
            order_type=data.get('type', 'Dine-In'),
            status='Completed',
            payment_method=data.get('paymentMethod', 'Cash'),
            total_amount=Decimal(str(data.get('total', 0)))
        )

        items = data.get('items', [])
        for item_data in items:
            menu_item = MenuItem.objects.get(id=item_data['id'])
            qty_ordered = item_data['qty']
            recipe_ingredients = Recipe.objects.filter(menu_item=menu_item)
            
            # --- IMPROVEMENT 3: INVENTORY SAFETY CHECK REMOVED ---
            # (Removed the ValidationError block so bills can finalize regardless of stock)

            # --- IMPROVEMENT 2: CORRECT COST CALCULATION (WITHOUT DEDUCTION) ---
            plate_cost = Decimal('0.00')
            for component in recipe_ingredients:
                # Add to the cost of a SINGLE plate (Kept this so your profit reports still work)
                plate_cost += (component.quantity_required * component.ingredient.cost_per_unit)
                
                # --- DEDUCTION AND LOGGING REMOVED HERE ---
                # We no longer subtract from component.ingredient.quantity_on_hand
                # We no longer create an InventoryLog for the sale
            
            # Total cost for this specific OrderItem (plate_cost * quantity)
            total_cogs_for_item = plate_cost * qty_ordered

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=qty_ordered,
                price_at_time=Decimal(str(item_data['price'])),
                cost_at_time=total_cogs_for_item # Snapshot saved!
            )

        return Response({'id': order.id, 'message': 'Order finalized successfully!'}, status=status.HTTP_201_CREATED)

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer