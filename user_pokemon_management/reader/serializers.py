# reader/serializers.py

from rest_framework import serializers
from storage.models import PokemonInstance, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username']

class PokemonInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PokemonInstance
        fields = '__all__'
