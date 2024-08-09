# reader/urls.py

from django.urls import path
from .views import UserPokemonList

urlpatterns = [
    path('api/ownershipData/<str:user_id>', UserPokemonList.as_view(), name='user-pokemon-list'),  # Removed trailing slash
]
