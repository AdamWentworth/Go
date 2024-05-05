from django.contrib import admin
from .models import User, PokemonInstance, Ownership, TradePair, Trade

admin.site.register(User)
admin.site.register(PokemonInstance)
admin.site.register(Ownership)
admin.site.register(TradePair)
admin.site.register(Trade)
