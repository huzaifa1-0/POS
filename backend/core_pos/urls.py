from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Notice the quotes around 'api.urls' and the use of include()
    path('api/', include('api.urls')), 
]