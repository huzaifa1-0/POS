from django import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CategoryViewSet, MenuItemViewSet, OrderViewSet, RegisterView, ReportDashboardView, VendorViewSet, ItemViewSet, StockEntryViewSet, RecipeViewSet, get_my_permissions, CustomTokenLoginView, manage_role_permissions, manage_user_roles

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'menu-items', MenuItemViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'items', ItemViewSet)
router.register(r'stock-entries', StockEntryViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'recipes', RecipeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # --- NEW: Auth Endpoints ---
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenLoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/permissions/', get_my_permissions, name='get_my_permissions'),

    path('auth/role-permissions/', manage_role_permissions, name='role_permissions'),
    path('auth/users/', manage_user_roles, name='manage_users'),
    path('reports/dashboard/', ReportDashboardView.as_view(), name='report-dashboard'),
]