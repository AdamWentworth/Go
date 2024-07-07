#storage/views.py

import threading
from django.http import JsonResponse
from .consumer import consume_messages

def start_consumer(request):
    threading.Thread(target=consume_messages, daemon=True).start()
    return JsonResponse({"message": "Kafka consumer started"})
