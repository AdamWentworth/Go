# user_pokemon_management/urls.py (or a similar file at the root level)

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('reader.urls')),  # Ensure the base URL includes your app's URLs
]
