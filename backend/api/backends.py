from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Allows a user to log in using either their username or their email address.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Check if the user exists by looking at EITHER the username OR the email column
            user = User.objects.get(Q(username=username) | Q(email=username))
        except User.DoesNotExist:
            return None

        # If we found them, verify the password
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None