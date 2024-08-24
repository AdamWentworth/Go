# storage/models.py

from django.db import models

class User(models.Model):
    user_id = models.CharField(max_length=255, primary_key=True)
    username = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'users'

class PokemonInstance(models.Model):
    instance_id = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    pokemon_id = models.IntegerField()
    nickname = models.CharField(max_length=255, null=True, blank=True)
    cp = models.IntegerField(null=True, blank=True)
    attack_iv = models.IntegerField(null=True, blank=True)
    defense_iv = models.IntegerField(null=True, blank=True)
    stamina_iv = models.IntegerField(null=True, blank=True)
    shiny = models.BooleanField(default=False)
    costume_id = models.IntegerField(null=True, blank=True)
    lucky = models.BooleanField(default=False)
    shadow = models.BooleanField(default=False)
    purified = models.BooleanField(default=False)
    fast_move_id = models.IntegerField(null=True, blank=True)
    charged_move1_id = models.IntegerField(null=True, blank=True)
    charged_move2_id = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    mirror = models.BooleanField(default=False)
    pref_lucky = models.BooleanField(default=False)
    registered = models.BooleanField(default=False)
    favorite = models.BooleanField(default=False)
    location_card = models.CharField(max_length=255, null=True, blank=True)
    location_caught = models.CharField(max_length=255, null=True, blank=True)
    friendship_level = models.IntegerField(null=True, blank=True)
    date_caught = models.DateField(null=True, blank=True)
    date_added = models.DateTimeField(auto_now_add=True)
    last_update = models.BigIntegerField(default=0)
    is_unowned = models.BooleanField(default=False)
    is_owned = models.BooleanField(default=False)
    is_for_trade = models.BooleanField(default=False)
    is_wanted = models.BooleanField(default=False)
    not_trade_list = models.JSONField(default=dict)
    not_wanted_list = models.JSONField(default=dict)
    trace_id = models.CharField(max_length=255, null=True, blank=True)
    wanted_filters = models.JSONField()
    trade_filters = models.JSONField()

    class Meta:
        db_table = 'instances'
