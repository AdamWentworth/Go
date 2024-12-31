# storage/models.py

from django.db import models

class User(models.Model):
    user_id = models.CharField(max_length=255, primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    latitude = models.FloatField(null=True, blank=True)  # New field for latitude
    longitude = models.FloatField(null=True, blank=True)  # New field for longitude

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

class Trade(models.Model):
    trade_id = models.CharField(max_length=255, primary_key=True)
    user_id_proposed = models.CharField(max_length=255)
    user_id_accepting = models.CharField(max_length=255)
    pokemon_instance_id_user_proposed = models.CharField(max_length=255)
    pokemon_instance_id_user_accepting = models.CharField(max_length=255, null=True, blank=True)

    trace_id = models.CharField(max_length=255, null=True, blank=True)
    username_proposed = models.CharField(max_length=255, null=True, blank=True)
    username_accepting = models.CharField(max_length=255, null=True, blank=True)

    # Status field: map enum to a choices tuple
    TRADE_STATUS_CHOICES = [
        ('proposed', 'proposed'),
        ('accepted', 'accepted'),
        ('denied', 'denied'),
        ('pending', 'pending'),
        ('completed', 'completed'),
        ('cancelled', 'cancelled'),
    ]
    trade_status = models.CharField(
        max_length=9,
        choices=TRADE_STATUS_CHOICES,
        default='proposed'
    )
    trade_proposal_date = models.DateTimeField(null=True, blank=True)
    trade_accepted_date = models.DateTimeField(null=True, blank=True)
    trade_completed_date = models.DateTimeField(null=True, blank=True)
    trade_cancelled_date = models.DateTimeField(null=True, blank=True)
    trade_cancelled_by = models.CharField(max_length=255, null=True, blank=True)
    is_special_trade = models.BooleanField(default=False)
    is_registered_trade = models.BooleanField(default=False)
    is_lucky_trade = models.BooleanField(default=False)
    trade_dust_cost = models.IntegerField(null=True, blank=True)

    # Friendship level (enum in DB)
    TRADE_FRIENDSHIP_CHOICES = [
        ('Good', 'Good'),
        ('Great', 'Great'),
        ('Ultra', 'Ultra'),
        ('Best', 'Best'),
    ]
    trade_friendship_level = models.CharField(
        max_length=5,
        choices=TRADE_FRIENDSHIP_CHOICES,
        default='Good'
    )
    user_1_trade_satisfaction = models.IntegerField(null=True, blank=True)
    user_2_trade_satisfaction = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'trades' 

    def __str__(self):
        return f"Trade #{self.trade_id} [{self.trade_status}]"
