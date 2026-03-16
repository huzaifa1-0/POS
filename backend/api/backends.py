from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # --- FIXED: Use .filter().first() instead of .get() ---
        user = User.objects.filter(Q(username=username) | Q(email=username)).first()
        
        if not user:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None