# receiver/urls.py

from django.urls import path
from .views import handle_batched_updates

urlpatterns = [
    path('api/batchedUpdates', handle_batched_updates, name='batched_updates'),
]
