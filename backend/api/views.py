from urllib import request

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.db.models import Sum, Count


from .permissions import HasRBACPermission
from .models import Category, Expense, MenuItem, Role, UserProfile, Vendor, Item, StockEntry, Order, OrderItem, Recipe, InventoryLog, Permission, Resource
from django.db import transaction
from django.core.exceptions import ValidationError
from .serializers import CategorySerializer, ExpenseSerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer, RecipeSerializer

from .models import Category, MenuItem, Vendor, Item, StockEntry, Order, OrderItem, Recipe, InventoryLog, Branch, UserProfile
from django.db import transaction
from django.core.exceptions import ValidationError
from .serializers import CategorySerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer, RecipeSerializer,BranchSerializer, OrderSerializer

from decimal import Decimal
from django.db.models import F, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from django.db.models.functions import Coalesce
from django.utils import timezone

from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .models import UserProfile
import calendar

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.roles.filter(name='Admin').exists())
        
        if is_admin:
            # Admins can see all expenses in the main Expense Page
            return Expense.objects.all().order_by('-date')
        elif hasattr(user, 'profile') and user.profile.branch:
            # 🚨 Managers ONLY see expenses for their specific branch!
            return Expense.objects.filter(branch=user.profile.branch).order_by('-date')
        return Expense.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        branch = None
        
        # 1. 🚨 If a Manager or Cashier logs an expense, forcefully lock it to their assigned branch!
        if hasattr(user, 'profile') and user.profile.branch:
            branch = user.profile.branch
            
        # 2. If an Admin logs an expense, let's see if they passed a specific branch ID
        elif (user.is_superuser or (hasattr(user, 'profile') and user.profile.roles.filter(name='Admin').exists())):
            branch_id = self.request.data.get('branch_id') or self.request.data.get('branch')
            if branch_id:
                try:
                    branch = Branch.objects.get(id=branch_id)
                except Branch.DoesNotExist:
                    pass
                    
        # 3. Save the expense securely into the database
        serializer.save(staff_member=user, branch=branch)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_permissions(request):
    """Returns a flat list of permission keys for the logged-in user."""
    
    # --- NEW: Check if Admin is simulating a role ---
    simulated_role = request.headers.get('X-Simulated-Role')
    
    if simulated_role and simulated_role != 'Admin' and request.user.is_superuser:
        try:
            role = Role.objects.get(name=simulated_role)
            perm_list = list(role.permissions.values_list('permission_key', flat=True))
            return Response({"permissions": perm_list})
        except Role.DoesNotExist:
            pass # Fallback to normal admin logic if role isn't found

    # Standard Admin Wildcard
    if request.user.is_superuser:
        return Response({"permissions": ["*"]})

    # Standard Staff Logic
    try:
        permissions = request.user.profile.roles.values_list(
            'permissions__permission_key', flat=True
        ).distinct()
        
        perm_list = [p for p in permissions if p] 
        return Response({"permissions": perm_list})
        
    except Exception:
        return Response({"permissions": []})    

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            try:
                user = User.objects.get(username=username)
                # If user exists, but password doesn't match, trigger the specific error
                if not user.check_password(password):
                    raise AuthenticationFailed('Incorrect Password')
            except User.DoesNotExist:
                # If the email doesn't exist at all
                raise AuthenticationFailed('No active account found.')
                
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        # Get the standard token
        token = super().get_token(user)

        # 1. Superuser Auto-Detect
        if user.is_superuser:
            token['role'] = 'Admin'
            token['branch_id'] = None
            return token
            
        # 2. Staff Auto-Detect
        try:
            profile = user.profile
            role = profile.roles.first() # Get their assigned role
            
            # Inject custom claims directly into the token
            token['role'] = role.name if role else 'Pending'
            token['branch_id'] = profile.branch.id if profile.branch else None
            
        except Exception:
            # If they don't have a profile setup yet
            token['role'] = 'Pending'
            token['branch_id'] = None
            
        return token
class CustomTokenLoginView(TokenObtainPairView):
    """Replaces the default JWT login view to enforce role checks"""
    serializer_class = CustomTokenObtainPairSerializer
# --- NEW: Registration View ---
# Make sure to import UserProfile at the top of your views.py!
# from .models import UserProfile 

class RegisterView(APIView):
    # 1. Tell Django: "Do NOT ask for a JWT token on this route!"
    permission_classes = [AllowAny] 

    def post(self, request):
        try:
            name = request.data.get('name')
            email = request.data.get('email')
            password = request.data.get('password')
            role_name = request.data.get('role') 
            
            # Check if they missed anything
            if not email or not password or not name or not role_name:
                return Response({'error': 'Please provide name, email, password, and role'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                validate_email(email)
            except ValidationError:
                return Response({'error': 'Invalid email format. Please provide a valid email.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if User.objects.filter(username=email).exists():
                return Response({'error': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)
                
            # 2. Create the user 
            user = User.objects.create(
                username=email, 
                email=email,
                first_name=name,
                password=make_password(password)
            )

            # 3. Create profile (but DO NOT attach a role yet for standard staff!)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            # 4 & 5. Secure Role Assignment
            if role_name == 'Admin':
                # ONLY if they are an Admin, give them the role instantly so they can setup the system
                target_role, _ = Role.objects.get_or_create(name='Admin')
                profile.roles.add(target_role)
                user.is_superuser = True
                user.is_staff = True
                user.save()
            else:
                # FIX: For 'Cashier' and 'Manager', we DO NOT attach the role.
                # Leaving their profile empty makes them "Pending" in your Settings page!
                pass

            return Response({'message': f'User registered successfully as {role_name}'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # --- NEW: CRASH CATCHER ---
            # If Python crashes, it will send the EXACT error text to React!
            return Response({'error': f'Server crash: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        item = instance.item
        
        quantity = request.data.get('quantity')
        price = request.data.get('price')

        # FIX: If the user edits the quantity, adjust the main Item's total!
        if quantity is not None:
            new_quantity = Decimal(str(quantity))
            quantity_difference = new_quantity - instance.quantity
            
            item.quantity_on_hand += quantity_difference
            item.save()
            
            instance.quantity = new_quantity

        if price is not None:
            instance.price = Decimal(str(price))
            
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        entry = self.get_object()
        item = entry.item
        
        # 1. Reverse the inventory quantity and value
        current_total_value = item.quantity_on_hand * item.cost_per_unit
        deleted_value = entry.quantity * entry.price
        
        new_quantity = item.quantity_on_hand - entry.quantity
        
        # 2. Recalculate Average Cost safely
        if new_quantity > 0:
            new_total_value = current_total_value - deleted_value
            # max() ensures cost doesn't drop below 0 due to decimal rounding
            item.cost_per_unit = max(Decimal('0.0000'), new_total_value / new_quantity)
        else:
            # If no stock is left, reset quantity and cost to 0
            new_quantity = Decimal('0.0000')
            item.cost_per_unit = Decimal('0.0000')
            
        item.quantity_on_hand = new_quantity
        item.save()

        # 3. Log the deletion in the InventoryLog
        InventoryLog.objects.create(
            item=item,
            quantity_change=-entry.quantity,  # Negative quantity to show removal
            reason=f"Deleted Stock Entry #{entry.id} (Reversed {entry.quantity} {item.unit} from {entry.vendor.name})"
        )

        # 4. Finally, delete the record
        entry.delete()
        
        return Response({"message": "Stock entry deleted and inventory reversed."}, status=status.HTTP_204_NO_CONTENT)
    
class ReportDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.roles.filter(name='Admin').exists())
        branch_id = request.headers.get('X-Branch-Id')
        
        if is_admin:
            if branch_id and branch_id != 'null':
                safe_orders = Order.objects.filter(branch_id=branch_id)
                # 🚨 STRICT ISOLATION: Only fetch expenses for this EXACT branch ID. No fallbacks!
                branch_expenses = Expense.objects.filter(branch_id=branch_id)
            else:
                safe_orders = Order.objects.all()
                branch_expenses = Expense.objects.all()
        elif hasattr(user, 'profile') and user.profile.branch:
            safe_orders = Order.objects.filter(branch=user.profile.branch)
            # 🚨 STRICT ISOLATION: Only fetch for Manager's branch
            branch_expenses = Expense.objects.filter(branch=user.profile.branch)
        else:
            safe_orders = Order.objects.none()
            branch_expenses = Expense.objects.none()

        orders = safe_orders.filter(status='Completed') 
        order_items = OrderItem.objects.filter(order__in=orders)

        total_income = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        cash_income = orders.filter(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        online_income = orders.exclude(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_cogs = order_items.aggregate(Sum('cost_at_time'))['cost_at_time__sum'] or 0
        
        total_expenses = branch_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        net_profit = total_income - total_cogs - total_expenses
        
        recent_expenses = branch_expenses.order_by('-date')[:50].values('id', 'description', 'amount', 'date', 'category')
        
        trend_data = []
        first_order = safe_orders.filter(status='Completed').order_by('created_at').first()
        if first_order:
            start_y, start_m = first_order.created_at.year, first_order.created_at.month
            end_y, end_m = timezone.now().year, timezone.now().month
            curr_y, curr_m = start_y, start_m
            while (curr_y < end_y) or (curr_y == end_y and curr_m <= end_m):
                m_orders = safe_orders.filter(status='Completed', created_at__year=curr_y, created_at__month=curr_m)
                m_rev = m_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
                trend_data.append({'name': f"{calendar.month_abbr[curr_m]} {curr_y}", 'revenue': m_rev})
                curr_m += 1
                if curr_m > 12: curr_m, curr_y = 1, curr_y + 1
        else:
            curr = timezone.now()
            trend_data.append({'name': f"{calendar.month_abbr[curr.month]} {curr.year}", 'revenue': 0})

        items_with_stock = Item.objects.annotate(true_stock=Coalesce(Sum('stock_entries__quantity'), Decimal('0.00')))
        low_stock = [{'name': i.name, 'quantity_on_hand': i.true_stock, 'unit': i.unit} for i in items_with_stock.filter(true_stock__lte=F('low_stock_threshold'))]
        top_items = order_items.values(name=F('menu_item__name')).annotate(total_sold=Sum('quantity'), revenue=Sum(F('quantity') * F('price_at_time'))).order_by('-total_sold')[:5]
        
        return Response({
            'total_income': total_income,
            'total_expenses': total_expenses,
            'cogs': total_cogs,             
            'net_profit': net_profit,       
            'cash_income': cash_income,
            'online_income': online_income,
            'trend_data': trend_data,
            'recent_expenses': list(recent_expenses),
            'top_items': list(top_items),
            'low_stock': low_stock,
            'low_stock_items': low_stock,
            'top_selling_items': list(top_items),
            'recent_orders': []
        })
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer  # Keeps your existing serializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Admin sees everything, Cashiers only see their branch
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.roles.filter(name='Admin').exists())
        if is_admin:
            return Order.objects.all().order_by('-created_at')
            
        if hasattr(user, 'profile') and user.profile.branch:
            return Order.objects.filter(branch=user.profile.branch).order_by('-created_at')
            
        return Order.objects.none()

    @transaction.atomic  
    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        
        # 2. Guaranteed Fresh Branch Lookup
        cashier_branch = None
        try:
            profile = UserProfile.objects.select_related('branch').get(user=user)
            cashier_branch = profile.branch
        except UserProfile.DoesNotExist:
            pass

        # 3. Hard-Save the Order! Bypassing weak serializers.
        order = Order.objects.create(
            branch=cashier_branch,  # 🚨 PERFECTLY ASSIGNED
            table_number=data.get('table_number', 'Takeaway'),
            order_type=data.get('type', 'Dine-In'),
            status='Completed',     # 🚨 FORCES IT TO SHOW IN REPORTS
            payment_method=data.get('paymentMethod', 'Cash'),
            total_amount=Decimal(str(data.get('total', 0)))
        )

        # 4. Safely link all cart items to the receipt
        for item in data.get('items', []):
            try:
                menu_item = MenuItem.objects.get(id=item['id'])
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=item['qty'],
                    price_at_time=item['price'],
                    cost_at_time=menu_item.cost_per_unit or 0
                )
            except Exception as e:
                print(f"Failed to save item on receipt: {e}")

        # 5. Return a successful 201 response to React
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer



class ManageInventoryView(APIView):
    # 1. Enforce our custom RBAC middleware
    permission_classes = [HasRBACPermission] 
    
    # 2. Define the exact action + resource required!
    required_permission = 'edit:inventory' 

    def post(self, request):
        # Code only runs if the user's Role has the 'edit:inventory' permission
        return Response({"message": "Inventory updated successfully"})
    

# --- NEW: ROLE PERMISSIONS MATRIX API ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_role_permissions(request):
    is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
    is_manager = hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Manager').exists()

    if not (is_admin or is_manager):
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        
    # 🚨 FORCE INITIALIZE ROLES (Ensures columns appear in Settings)
    Role.objects.get_or_create(name='Admin')
    Role.objects.get_or_create(name='Manager')
    Role.objects.get_or_create(name='Cashier')

    AVAILABLE_SCREENS = [
        {'key': 'view:pos_home', 'label': 'POS Terminal'},
        {'key': 'view:reports', 'label': 'Reports Dashboard'},
        {'key': 'view:inventory', 'label': 'Inventory'},
        {'key': 'edit:inventory', 'label': 'Manage Stock'},
        {'key': 'view:expenses', 'label': 'Expenses'},
        {'key': 'manage:menu', 'label': 'Menu Manager'},
        {'key': 'view:recipes', 'label': 'Recipe Builder'},
        {'key': 'view:vendors', 'label': 'Vendors'},
        {'key': 'view:settings', 'label': 'Settings Dashboard'},
    ]

    res, _ = Resource.objects.get_or_create(name='System Apps', slug='system')
    for screen in AVAILABLE_SCREENS:
        Permission.objects.get_or_create(resource=res, action='view', permission_key=screen['key'])

    # --- 🚨 FIX 2: Force create the roles so they ALWAYS appear in the Matrix ---
    Role.objects.get_or_create(name='Admin')
    Role.objects.get_or_create(name='Manager')
    Role.objects.get_or_create(name='Cashier')

    if request.method == 'GET':
        if is_admin:
            roles = Role.objects.exclude(name='Admin')
        elif is_manager:
            roles = Role.objects.filter(name='Cashier')

        matrix = []
        for role in roles:
            role_perms = list(role.permissions.values_list('permission_key', flat=True))
            matrix.append({
                'role_id': role.id,
                'role_name': role.name,
                'permissions': role_perms
            })

        return Response({
            'screens': AVAILABLE_SCREENS,
            'matrix': matrix
        })

    elif request.method == 'POST':
        role_id = request.data.get('role_id')
        permission_keys = request.data.get('permissions', [])
        
        role = Role.objects.get(id=role_id)
        
        if is_manager and role.name in ['Admin', 'Manager']:
            return Response({'error': 'Managers can only modify Cashier permissions.'}, status=status.HTTP_403_FORBIDDEN)

        role.permissions.clear() 
        perms_to_add = Permission.objects.filter(permission_key__in=permission_keys)
        role.permissions.add(*perms_to_add)
        
        return Response({'message': f'Permissions updated for {role.name}'})


# --- NEW: STAFF APPROVALS API ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_user_roles(request):
    is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
    is_manager = hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Manager').exists()

    if not (is_admin or is_manager):
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    # 🚨 FORCE INITIALIZE ROLES (Ensures dropdowns work)
    Role.objects.get_or_create(name='Admin')
    Role.objects.get_or_create(name='Manager')
    Role.objects.get_or_create(name='Cashier')

    if request.method == 'GET':
        if is_admin:
            # Admins see everyone
            users = User.objects.all().values('id', 'username', 'first_name', 'email')
            roles = Role.objects.all().values('id', 'name')
        elif is_manager:
            # Managers only see Cashiers and Pending users
            roles = Role.objects.filter(name='Cashier').values('id', 'name')
            users = User.objects.exclude(profile__roles__name__in=['Admin', 'Manager']).exclude(is_superuser=True).values('id', 'username', 'first_name', 'email')

        user_profiles = UserProfile.objects.prefetch_related('roles').all()
        assignments = {}
        for profile in user_profiles:
            role = profile.roles.first()
            assignments[profile.user.id] = role.name if role else "Pending"

        return Response({'users': list(users), 'roles': list(roles), 'assignments': assignments})
    
    elif request.method == 'POST':
        user_id = request.data.get('user_id')
        role_name = request.data.get('role_name')
        target_user = User.objects.get(id=user_id)
        
        # Security: Prevent managers from modifying admin accounts
        target_is_admin = target_user.is_superuser or (hasattr(target_user, 'profile') and target_user.profile.roles.filter(name='Admin').exists())
        if is_manager and target_is_admin:
             return Response({'error': 'Cannot modify Admin accounts'}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        profile.roles.clear()
        
        if role_name != "Pending":
            if is_manager and role_name in ['Admin', 'Manager']:
                return Response({'error': 'Managers can only assign Cashier role'}, status=status.HTTP_403_FORBIDDEN)
            role = Role.objects.get(name=role_name)
            profile.roles.add(role)
            
        return Response({'message': f'Access approved successfully!'})

class BranchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

class CreateCashierView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # --- FIXED: Safe RBAC Check ---
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
        
        if not is_admin:
            return Response({'error': 'Only admins can create cashiers'}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        branch_id = request.data.get('branch_id')

        role_name = request.data.get('role', 'Cashier')

        if not all([name, email, password, branch_id]):
            return Response({'error': 'Please provide name, email, password and branch_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(email)
        except ValidationError:
            return Response({'error': 'Invalid email format. Please provide a valid email.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        branch = Branch.objects.get(id=branch_id)

        user = User.objects.create(
            username=email,
            email=email,
            first_name=name,
            password=make_password(password)
        )

        # Unified Profile Creation
        profile = UserProfile.objects.create(user=user, branch=branch)
        assigned_role, _ = Role.objects.get_or_create(name=role_name)
        profile.roles.add(assigned_role)

        return Response({'message': f'{role_name} {name} created and assigned to {branch.name}'}, status=status.HTTP_201_CREATED)

class ChangeCashierBranchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # --- FIXED: Safe RBAC Check ---
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
        
        if not is_admin:
            return Response({'error': 'Only admins can change cashier branch'}, status=status.HTTP_403_FORBIDDEN)

        cashier_id = request.data.get('cashier_id')
        new_branch_id = request.data.get('branch_id')

        if not all([cashier_id, new_branch_id]):
            return Response({'error': 'Please provide cashier_id and branch_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(id=cashier_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Cashier not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            new_branch = Branch.objects.get(id=new_branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)

        old_branch = profile.branch.name if profile.branch else 'None'
        profile.branch = new_branch
        profile.save()

        return Response({'message': f'Cashier moved from {old_branch} to {new_branch.name}'}, status=status.HTTP_200_OK)
    



class BranchSalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Security Check
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
        if not is_admin:
            return Response({'error': 'Only admins can view sales reports'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Get ALL branches (even if they have 0 sales!)
        branches = Branch.objects.filter(is_active=True)
        formatted_report = []
        
        for branch in branches:
            # Calculate totals specifically for this branch
            totals = Order.objects.filter(branch=branch, status='Completed').aggregate(
                total_orders=Count('id'),
                total_revenue=Sum('total_amount')
            )
            
            formatted_report.append({
                'branch_name': branch.name,
                'total_orders': totals['total_orders'] or 0,
                'total_revenue': totals['total_revenue'] or 0
            })
            
    

        # Sort by highest revenue
        formatted_report.sort(key=lambda x: x['total_revenue'], reverse=True)

        return Response(formatted_report, status=status.HTTP_200_OK)
    



# Make sure User is imported at the top: from django.contrib.auth.models import User

# Returns comprehensive staff details (for Admin/Settings)
class StaffListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
        if not is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all()
        staff_data = []
        
        for user in users:
            role_name = 'Pending'
            branch_name = 'Unassigned'
            # 🚨 FIX: We need the ID for React filtering in the popup!
            branch_id = None 
            
            if user.is_superuser:
                role_name = 'Admin'
            else:
                profile = UserProfile.objects.filter(user=user).first()
                if profile:
                    role = profile.roles.first()
                    if role:
                        role_name = role.name
                    if profile.branch:
                        branch_name = profile.branch.name
                        # 🚨 FIX: Capture the actual ID here
                        branch_id = profile.branch.id 
                    
            staff_data.append({
                'id': user.id,
                'name': user.first_name or user.username or 'Unknown',
                'email': user.email or user.username,
                'role': role_name,
                'branch_name': branch_name,
                # 🚨 Send it to React
                'branch_id': branch_id 
            })
            
        return Response(staff_data, status=status.HTTP_200_OK)


class UpdateUserRoleView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        is_admin = request.user.is_superuser
        profile = UserProfile.objects.filter(user=request.user).first()
        if not is_admin and profile and profile.roles.filter(name='Admin').exists():
            is_admin = True
            
        if not is_admin: return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_update = User.objects.get(pk=pk)
            new_role_name = request.data.get('role')
            
            target_profile = UserProfile.objects.filter(user=user_to_update).first()
            if not target_profile: target_profile = UserProfile.objects.create(user=user_to_update)
                
            role_obj, _ = Role.objects.get_or_create(name=new_role_name)
            target_profile.roles.clear()
            target_profile.roles.add(role_obj)
            return Response({"message": "Role updated successfully"})
        except User.DoesNotExist: return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UpdateUserBranchView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        is_admin = request.user.is_superuser
        profile = UserProfile.objects.filter(user=request.user).first()
        if not is_admin and profile and profile.roles.filter(name='Admin').exists():
            is_admin = True
            
        if not is_admin: return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user_to_update = User.objects.get(pk=pk)
            branch_id = request.data.get('branch_id')
            
            target_profile = UserProfile.objects.filter(user=user_to_update).first()
            if not target_profile: target_profile = UserProfile.objects.create(user=user_to_update)
            
            if branch_id:
                target_profile.branch = Branch.objects.get(pk=branch_id)
            else:
                target_profile.branch = None
            target_profile.save()
            return Response({"message": "Branch updated successfully"})
        except User.DoesNotExist: return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# --- 2. MASTER BRANCH REPORT (For your new page) ---
class MasterReportView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        is_admin = request.user.is_superuser
        profile = UserProfile.objects.filter(user=request.user).first()
        if not is_admin and profile and profile.roles.filter(name='Admin').exists():
            is_admin = True
                
        if not is_admin: return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        branches = Branch.objects.all()
        branch_reports = []
        
        for branch in branches:
            orders = Order.objects.filter(branch=branch, status='Completed')
            total_income = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            cash_income = orders.filter(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            online_income = orders.exclude(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            # 🚨 DIRECT BRANCH EXPENSE LOOKUP!
            total_expenses = Expense.objects.filter(branch=branch).aggregate(Sum('amount'))['amount__sum'] or 0
            
            branch_reports.append({
                'id': branch.id,
                'name': branch.name,
                'address': branch.address,
                'total_income': total_income,
                'cash_income': cash_income,
                'online_income': online_income,
                'total_expenses': total_expenses
            })

        trend_data = []
        first_order = Order.objects.filter(status='Completed').order_by('created_at').first()
        if first_order:
            start_y, start_m = first_order.created_at.year, first_order.created_at.month
            end_y, end_m = timezone.now().year, timezone.now().month
            curr_y, curr_m = start_y, start_m
            while (curr_y < end_y) or (curr_y == end_y and curr_m <= end_m):
                m_orders = Order.objects.filter(status='Completed', created_at__year=curr_y, created_at__month=curr_m)
                m_rev = m_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
                trend_data.append({'name': f"{calendar.month_abbr[curr_m]} {curr_y}", 'revenue': m_rev})
                curr_m += 1
                if curr_m > 12: curr_m, curr_y = 1, curr_y + 1
        else:
            curr = timezone.now()
            trend_data.append({'name': f"{calendar.month_abbr[curr.month]} {curr.year}", 'revenue': 0})
            
        return Response({'branch_reports': branch_reports, 'network_trend': trend_data}, status=status.HTTP_200_OK)
class UpdateStaffBranchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # 1. Ensure the user making the request is an Admin
        is_admin = request.user.is_superuser
        if not is_admin:
            admin_profile = UserProfile.objects.filter(user=request.user).first()
            if admin_profile and admin_profile.roles.filter(name='Admin').exists():
                is_admin = True
                
        if not is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Get the variables sent from React
        user_id = request.data.get('user_id')
        branch_id = request.data.get('branch_id')

        try:
            # 3. Find the user and the new branch
            user_to_update = User.objects.get(id=user_id)
            profile, _ = UserProfile.objects.get_or_create(user=user_to_update)
            new_branch = Branch.objects.get(id=branch_id)

            # 🚨 4. ENFORCE 1 MANAGER PER BRANCH RULE
            if profile.roles.filter(name='Manager').exists():
                # Check if this new branch already has a manager (excluding this current user)
                if UserProfile.objects.filter(branch=new_branch, roles__name='Manager').exclude(user__id=user_id).exists():
                    return Response({'error': f'Cannot move user. "{new_branch.name}" already has a Manager!'}, status=status.HTTP_400_BAD_REQUEST)

            # 5. Save the new branch
            profile.branch = new_branch
            profile.save()
            return Response({"message": "Branch updated successfully"}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)


class UpdateStaffRoleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # 1. Admin Verification
        is_admin = request.user.is_superuser
        if not is_admin:
            admin_profile = UserProfile.objects.filter(user=request.user).first()
            if admin_profile and admin_profile.roles.filter(name='Admin').exists():
                is_admin = True
                
        if not is_admin:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Get the exact variables sent from React
        user_id = request.data.get('user_id')
        role_name = request.data.get('role_name')
        
        try:
            # 3. Find user and profile
            user_to_update = User.objects.get(id=user_id)
            profile, _ = UserProfile.objects.get_or_create(user=user_to_update)
            
            # 🚨 4. ENFORCE 1 MANAGER PER BRANCH ON ROLE CHANGE
            if role_name == 'Manager' and profile.branch:
                if UserProfile.objects.filter(branch=profile.branch, roles__name='Manager').exclude(user__id=user_id).exists():
                    return Response({'error': f'Their assigned branch ({profile.branch.name}) already has a Manager.'}, status=status.HTTP_400_BAD_REQUEST)

            # 5. Update the Role
            role_obj, _ = Role.objects.get_or_create(name=role_name)
            profile.roles.clear()
            profile.roles.add(role_obj)
            return Response({'message': 'Role updated successfully'}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found'}, status=status.HTTP_404_NOT_FOUND)

