from django.db import models

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    trainer_code = models.CharField(max_length=100, blank=True, null=True)

class PokemonInstance(models.Model):
    instance_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    pokemon_id = models.IntegerField()  # Assumed to align with data provided by the Pokemon Data Service
    cp = models.IntegerField()
    attack_iv = models.IntegerField()
    defense_iv = models.IntegerField()
    stamina_iv = models.IntegerField()
    shiny = models.BooleanField(default=False)
    costume_id = models.IntegerField(null=True, blank=True)
    lucky = models.BooleanField(default=False)
    shadow = models.BooleanField(default=False)
    purified = models.BooleanField(default=False)
    fast_move_id = models.IntegerField(null=True, blank=True)
    charged_move1_id = models.IntegerField(null=True, blank=True)
    charged_move2_id = models.IntegerField(null=True, blank=True)
    weight = models.FloatField()
    height = models.FloatField()
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')], blank=True, null=True)
    mirror = models.BooleanField(default=False)
    friendship_level = models.IntegerField(choices=[(i, str(i)) for i in range(6)], default=0)
    date_caught = models.DateTimeField()
    date_added = models.DateTimeField(auto_now_add=True)

class Ownership(models.Model):
    id = models.AutoField(primary_key=True)
    instance = models.OneToOneField(PokemonInstance, on_delete=models.CASCADE, db_column='instance_id', unique=True)
    is_owned = models.BooleanField(default=True)
    is_for_trade = models.BooleanField(default=False)
    is_wanted = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(is_owned=True, is_for_trade=True), name='ownership_for_trade_check'),
            models.CheckConstraint(check=models.Q(is_wanted=True, is_owned=False, is_for_trade=False), name='wanted_without_ownership')
        ]

class TradePair(models.Model):
    id = models.AutoField(primary_key=True)
    offered_instance = models.ForeignKey(PokemonInstance, on_delete=models.CASCADE, db_column='offered_instance_id', related_name='offered_trades')
    desired_instance = models.ForeignKey(PokemonInstance, on_delete=models.CASCADE, db_column='desired_instance_id', related_name='desired_trades')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')

class Trade(models.Model):
    trade_id = models.AutoField(primary_key=True)
    instance_id_from_user_1 = models.ForeignKey(PokemonInstance, on_delete=models.CASCADE, db_column='instance_id_from_user_1', related_name='trades_as_user_1')
    instance_id_from_user_2 = models.ForeignKey(PokemonInstance, on_delete=models.CASCADE, db_column='instance_id_from_user_2', related_name='trades_as_user_2')
    user_1 = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_1_id', related_name='initiated_trades')
    user_2 = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_2_id', related_name='received_trades')
    status = models.CharField(max_length=10, choices=[('pending', 'Pending'), ('completed', 'Completed'), ('cancelled', 'Cancelled')])
    engagement_date = models.DateTimeField()
    completion_date = models.DateTimeField(null=True, blank=True)
    cancellation_date = models.DateTimeField(null=True, blank=True)
