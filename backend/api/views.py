from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .permissions import HasRBACPermission
from .models import Category, Expense, MenuItem, Role, UserProfile, Vendor, Item, StockEntry, Order, OrderItem, Recipe, InventoryLog, Branch, Permission, Resource
from django.db import transaction
from django.core.exceptions import ValidationError
from .serializers import CategorySerializer, ExpenseSerializer, MenuItemSerializer, VendorSerializer, ItemSerializer, StockEntrySerializer, RecipeSerializer, BranchSerializer
from decimal import Decimal
from django.db.models import F, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from django.db.models.functions import Coalesce


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_permissions(request):
    if request.user.is_superuser:
        return Response({"permissions": ["*"]})
    try:
        permissions = request.user.profile.roles.values_list(
            'permissions__permission_key', flat=True
        ).distinct()
        perm_list = [p for p in permissions if p]
        return Response({"permissions": perm_list})
    except Exception:
        return Response({"permissions": []})


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        requested_role = attrs.get('role')

        try:
            profile = user.profile
            has_any_role = profile.roles.exists()
            has_requested_role = profile.roles.filter(name=requested_role).exists()
        except Exception:
            has_any_role = False
            has_requested_role = False

        if not has_any_role and not user.is_superuser:
            raise AuthenticationFailed("Account created successfully. Please wait for your Manager to approve your access.")

        if requested_role == 'Admin' and user.is_superuser:
            data['role'] = requested_role
            return data

        if not has_requested_role:
            raise AuthenticationFailed(f"Access Denied: You do not have the '{requested_role}' role.")

        data['role'] = requested_role
        return data


class CustomTokenLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            name = request.data.get('name')
            email = request.data.get('email')
            password = request.data.get('password')
            role_name = request.data.get('role')

            if not email or not password or not name or not role_name:
                return Response({'error': 'Please provide name, email, password, and role'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=email).exists():
                return Response({'error': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create(
                username=email,
                email=email,
                first_name=name,
                password=make_password(password)
            )

            profile, _ = UserProfile.objects.get_or_create(user=user)

            if role_name == 'Admin':
                target_role, _ = Role.objects.get_or_create(name='Admin')
                profile.roles.add(target_role)
                user.is_superuser = True
                user.is_staff = True
                user.save()

            return Response({'message': f'User registered successfully as {role_name}'}, status=status.HTTP_201_CREATED)

        except Exception as e:
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
    def create(self, request, *args, **kwargs):
        item_id = request.data.get('item_id')
        vendor_id = request.data.get('vendor_id')
        quantity = Decimal(str(request.data.get('quantity')))
        price = Decimal(str(request.data.get('price')))

        item = Item.objects.get(id=item_id)
        vendor = Vendor.objects.get(id=vendor_id)

        total_value_on_hand = item.quantity_on_hand * item.cost_per_unit
        new_purchase_value = quantity * price
        new_total_quantity = item.quantity_on_hand + quantity

        if new_total_quantity > 0:
            item.cost_per_unit = (total_value_on_hand + new_purchase_value) / new_total_quantity

        item.quantity_on_hand = new_total_quantity
        item.save()

        entry = StockEntry.objects.create(item=item, vendor=vendor, quantity=quantity, price=price)

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

        current_total_value = item.quantity_on_hand * item.cost_per_unit
        deleted_value = entry.quantity * entry.price
        new_quantity = item.quantity_on_hand - entry.quantity

        if new_quantity > 0:
            new_total_value = current_total_value - deleted_value
            item.cost_per_unit = max(Decimal('0.0000'), new_total_value / new_quantity)
        else:
            new_quantity = Decimal('0.0000')
            item.cost_per_unit = Decimal('0.0000')

        item.quantity_on_hand = new_quantity
        item.save()

        InventoryLog.objects.create(
            item=item,
            quantity_change=-entry.quantity,
            reason=f"Deleted Stock Entry #{entry.id} (Reversed {entry.quantity} {item.unit} from {entry.vendor.name})"
        )

        entry.delete()
        return Response({"message": "Stock entry deleted and inventory reversed."}, status=status.HTTP_204_NO_CONTENT)


class ReportDashboardView(APIView):
    def get(self, request):
        orders = Order.objects.filter(status='Completed')
        order_items = OrderItem.objects.filter(order__in=orders)

        total_income = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        cash_income = orders.filter(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        online_income = orders.exclude(payment_method='Cash').aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        total_cogs = order_items.aggregate(Sum('cost_at_time'))['cost_at_time__sum'] or 0
        net_profit = total_income - total_cogs

        items_with_stock = Item.objects.annotate(
            true_stock=Coalesce(Sum('stock_entries__quantity'), Decimal('0.00'))
        )
        low_stock_query = items_with_stock.filter(true_stock__lte=F('low_stock_threshold'))
        low_stock = [
            {'name': item.name, 'quantity_on_hand': item.true_stock, 'unit': item.unit}
            for item in low_stock_query
        ]

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
            'cogs': total_cogs,
            'net_profit': net_profit,
            'cash_income': cash_income,
            'online_income': online_income,
            'top_items': list(top_items),
            'low_stock': low_stock,
            'recent_orders': list(recent_orders)
        })


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data

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

            plate_cost = Decimal('0.00')
            for component in recipe_ingredients:
                plate_cost += (component.quantity_required * component.ingredient.cost_per_unit)

            total_cogs_for_item = plate_cost * qty_ordered

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=qty_ordered,
                price_at_time=Decimal(str(item_data['price'])),
                cost_at_time=total_cogs_for_item
            )

        return Response({'id': order.id, 'message': 'Order finalized successfully!'}, status=status.HTTP_201_CREATED)


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer


class BranchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer


class CreateCashierView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'admin':
            return Response({'error': 'Only admins can create cashiers'}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        branch_id = request.data.get('branch_id')

        if not all([name, email, password, branch_id]):
            return Response({'error': 'Please provide name, email, password and branch_id'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        branch = Branch.objects.get(id=branch_id)

        user = User.objects.create(
            username=email,
            email=email,
            first_name=name,
            password=make_password(password)
        )

        UserProfile.objects.create(user=user, role='cashier', branch=branch)

        return Response({'message': f'Cashier {name} created and assigned to {branch.name}'}, status=status.HTTP_201_CREATED)


class ChangeCashierBranchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'admin':
            return Response({'error': 'Only admins can change cashier branch'}, status=status.HTTP_403_FORBIDDEN)

        cashier_id = request.data.get('cashier_id')
        new_branch_id = request.data.get('branch_id')

        if not all([cashier_id, new_branch_id]):
            return Response({'error': 'Please provide cashier_id and branch_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(id=cashier_id, role='cashier')
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


class ManageInventoryView(APIView):
    permission_classes = [HasRBACPermission]
    required_permission = 'edit:inventory'

    def post(self, request):
        return Response({"message": "Inventory updated successfully"})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_role_permissions(request):
    is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
    is_manager = hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Manager').exists()

    if not (is_admin or is_manager):
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    AVAILABLE_SCREENS = [
        {'key': 'view:pos_home', 'label': 'POS Terminal'},
        {'key': 'view:reports', 'label': 'Reports Dashboard'},
        {'key': 'view:inventory', 'label': 'Inventory'},
        {'key': 'view:expenses', 'label': 'Expenses'},
        {'key': 'view:recipes', 'label': 'Recipe Builder'},
        {'key': 'view:vendors', 'label': 'Vendors'},
        {'key': 'view:settings', 'label': 'Settings Dashboard'},
    ]

    res, _ = Resource.objects.get_or_create(name='System Apps', slug='system')
    for screen in AVAILABLE_SCREENS:
        Permission.objects.get_or_create(resource=res, action='view', permission_key=screen['key'])

    if request.method == 'GET':
        roles = Role.objects.exclude(name='Admin') if is_admin else Role.objects.filter(name='Cashier')
        matrix = []
        for role in roles:
            role_perms = list(role.permissions.values_list('permission_key', flat=True))
            matrix.append({'role_id': role.id, 'role_name': role.name, 'permissions': role_perms})
        return Response({'screens': AVAILABLE_SCREENS, 'matrix': matrix})

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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_user_roles(request):
    is_admin = request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Admin').exists())
    is_manager = hasattr(request.user, 'profile') and request.user.profile.roles.filter(name='Manager').exists()

    if not (is_admin or is_manager):
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        if is_admin:
            users = User.objects.all().values('id', 'username', 'first_name', 'email')
            roles = Role.objects.all().values('id', 'name')
        elif is_manager:
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

        return Response({'message': 'Access approved successfully!'})