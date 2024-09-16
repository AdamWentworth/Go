# reader/serializers.py

from rest_framework import serializers
from .models import PokemonInstance, User  # Import from reader.models now

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username']

class PokemonInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PokemonInstance
        fields = '__all__'
