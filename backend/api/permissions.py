from rest_framework import permissions

from backend.api.models import UserProfile

class HasRBACPermission(permissions.BasePermission):
    """
    Custom permission class to check if a user has a specific granular permission.
    Usage in views: permission_classes = [HasRBACPermission]
    Needs a 'required_permission' attribute on the View.
    """
    
    def has_permission(self, request, view):
        # 1. Superusers always get full access
        if request.user and request.user.is_superuser:
            return True

        # 2. Check if the view defined a specific permission required
        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            # If the dev forgot to protect the route, deny access by default (Secure by design)
            return False

        # 3. Fetch user's permissions via their roles (Optimized query)
        try:
            user_profile = request.user.profile
            # Check if any of the user's roles contain the required permission
            has_perm = user_profile.roles.filter(
                permissions__permission_key=required_permission
            ).exists()
            return has_perm
        except getattr(request.user, 'profile', UserProfile.DoesNotExist):
            return False