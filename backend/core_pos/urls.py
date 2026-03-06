from django.contrib import admin
from django.urls import path, include
from django.conf import settings         # 🔴 ADD THIS
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Notice the quotes around 'api.urls' and the use of include()
    path('api/', include('api.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)