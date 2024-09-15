# reader/views.py

import jwt
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from .models import PokemonInstance, User  # Import from reader.models now
from .serializers import PokemonInstanceSerializer
import logging

console_logger = logging.getLogger('consoleLogger')
file_logger = logging.getLogger('fileLogger')

def verify_access_token(request):
    token = request.COOKIES.get('accessToken')
    if not token:
        console_logger.info("JWT token is missing in cookies")
        file_logger.error("JWT token is missing in cookies")
        return False

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        console_logger.info("Token decoded successfully")
        file_logger.info("Token decoded successfully")
        request.payload = payload  # Store the decoded payload for later use
        return True
    except jwt.ExpiredSignatureError:
        console_logger.info("Token has expired")
        file_logger.error("Token has expired")
        return False
    except jwt.PyJWTError as e:
        console_logger.info(f"Token verification failed: {e}")
        file_logger.error(f"Token verification failed: {e}")
        return False

class UserPokemonList(APIView):
    def get(self, request, user_id):
        console_logger.info("GET /api/ownershipData")
        
        # Token verification
        if not verify_access_token(request):
            console_logger.info("User authentication failed with status 403")
            return JsonResponse({'error': 'Authentication failed'}, status=403)

        # Token is valid, now check the user
        user_id_from_token = request.payload.get('user_id')
        if user_id_from_token != user_id:
            console_logger.info("Token user_id does not match the requested user_id")
            return JsonResponse({'error': 'User mismatch'}, status=403)

        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            # Log that the user wasn't found but return an empty result as requested
            console_logger.info(f"User not found for id: {user_id}, returning empty data")
            file_logger.error(f"User not found: {user_id}, returning empty data")
            return JsonResponse({}, safe=False)

        # Proceed with fetching Pokémon instances if the user exists
        pokemon_instances = PokemonInstance.objects.filter(user=user)
        serializer = PokemonInstanceSerializer(pokemon_instances, many=True)

        response_data = {}
        for instance in serializer.data:
            instance_id = instance.pop('instance_id')
            instance.pop('user', None)
            instance.pop('trace_id', None)
            response_data[instance_id] = instance

        instance_count = len(response_data)
        console_logger.info(f"User {user.username} retrieved {instance_count} Pokemon instances with status 200")
        file_logger.info(f"GET /api/ownershipData/{user_id} - User {user.username} retrieved {instance_count} Pokemon instances with status 200")
        return JsonResponse(response_data, safe=False)

    def post(self, request, user_id):
        console_logger.info("POST /api/ownershipData")
        
        # Token verification
        if not verify_access_token(request):
            console_logger.info("User authentication failed with status 403")
            return JsonResponse({'error': 'Authentication failed'}, status=403)

        # Attempt to retrieve the user based on the decoded token
        user_id_from_token = request.payload.get('user_id')
        if user_id_from_token != user_id:
            console_logger.info("Token user_id does not match the requested user_id")
            return JsonResponse({'error': 'User mismatch'}, status=403)

        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            console_logger.info(f"User not found for id: {user_id}")
            file_logger.error(f"User not found: {user_id}")
            return JsonResponse({'error': 'User not found'}, status=404)

        # Process the Pokémon instance data
        data = request.data
        for instance_data in data:
            instance, created = PokemonInstance.objects.update_or_create(
                instance_id=instance_data['instance_id'],
                defaults={'user': user, **instance_data}
            )
        
        console_logger.info(f"User {user.username} updated/created {len(data)} Pokemon instances with status 201")
        file_logger.debug(f"POST /api/ownershipData/{user_id} - User {user.username} updated/created {len(data)} Pokemon instances with status 201")
        return JsonResponse({'status': 'success'}, status=201)

    def set_cors_headers(self, response):
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'content-type, authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
