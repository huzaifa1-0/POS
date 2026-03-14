from django import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CategoryViewSet, MenuItemViewSet, OrderViewSet, RegisterView, ReportDashboardView, VendorViewSet, ItemViewSet, StockEntryViewSet, RecipeViewSet, BranchViewSet, CreateCashierView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'menu-items', MenuItemViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'items', ItemViewSet)
router.register(r'stock-entries', StockEntryViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'recipes', RecipeViewSet)
router.register(r'branches', BranchViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # --- NEW: Auth Endpoints ---
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('reports/dashboard/', ReportDashboardView.as_view(), name='report-dashboard'),
    path('auth/create-cashier/', CreateCashierView.as_view(), name='create-cashier'),
]