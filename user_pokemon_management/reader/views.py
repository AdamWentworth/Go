# reader/views.py

import jwt
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from storage.models import PokemonInstance, User
from .serializers import PokemonInstanceSerializer
import logging

logger = logging.getLogger(__name__)

def verify_access_token(request):
    token = request.COOKIES.get('accessToken')
    if not token:
        logger.error("JWT token is missing in cookies")
        return False

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        logger.info("Token decoded successfully")
        user_id = payload.get('user_id')
        user = User.objects.get(user_id=user_id)  # Retrieve user using string-based user_id
        request.user = user  # Set the user in the request
        return True
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        return False
    except jwt.PyJWTError as e:  # Correct exception for PyJWT
        logger.error(f"Token verification failed: {e}")
        return False
    except User.DoesNotExist:
        logger.error("User not found")
        return False

class UserPokemonList(APIView):
    def get(self, request, user_id):
        if not verify_access_token(request):
            return JsonResponse({'error': 'Authentication failed'}, status=403)
        
        try:
            user = User.objects.get(user_id=user_id)
            pokemon_instances = PokemonInstance.objects.filter(user=user)
            serializer = PokemonInstanceSerializer(pokemon_instances, many=True)
            
            # Transform the list of serialized data into a dictionary keyed by instance_id
            response_data = {}
            for instance in serializer.data:
                instance_id = instance.pop('instance_id')
                instance.pop('user', None)
                instance.pop('trace_id', None)
                response_data[instance_id] = instance
            
            return JsonResponse(response_data, safe=False)  # safe=False is necessary to allow serialization of dicts
        except User.DoesNotExist:
            logger.error(f"User not found: {user_id}")
            return JsonResponse({'error': 'User not found'}, status=404)

    def post(self, request, user_id):
        if not verify_access_token(request):
            return JsonResponse({'error': 'Authentication failed'}, status=403)

        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            logger.error(f"User not found: {user_id}")
            return JsonResponse({'error': 'User not found'}, status=404)

        data = request.data
        for instance_data in data:
            instance, created = PokemonInstance.objects.update_or_create(
                instance_id=instance_data['instance_id'],
                defaults={'user': user, **instance_data}
            )
        return JsonResponse({'status': 'success'}, status=201)

    def set_cors_headers(self, response):
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'content-type, authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
