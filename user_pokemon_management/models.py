from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False)
    trainer_code = db.Column(db.String(255))

class PokemonInstance(db.Model):
    __tablename__ = 'instances'
    instance_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    pokemon_id = db.Column(db.Integer, nullable=False)
    cp = db.Column(db.Integer)
    attack_iv = db.Column(db.Integer)
    defense_iv = db.Column(db.Integer)
    stamina_iv = db.Column(db.Integer)
    shiny = db.Column(db.Boolean)
    costume_id = db.Column(db.Integer)
    lucky = db.Column(db.Boolean)
    shadow = db.Column(db.Boolean)
    purified = db.Column(db.Boolean)
    fast_move_id = db.Column(db.Integer)
    charged_move1_id = db.Column(db.Integer)
    charged_move2_id = db.Column(db.Integer)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    gender = db.Column(db.String(1))
    mirror = db.Column(db.Boolean)
    friendship_level = db.Column(db.Integer)
    date_caught = db.Column(db.DateTime)
    date_added = db.Column(db.DateTime, default=db.func.current_timestamp())

class Ownership(db.Model):
    __tablename__ = 'ownership'
    id = db.Column(db.Integer, primary_key=True)
    instance_id = db.Column(db.Integer, db.ForeignKey('instances.instance_id'), nullable=False)
    is_owned = db.Column(db.Boolean, nullable=False)
    is_for_trade = db.Column(db.Boolean, nullable=False)
    is_wanted = db.Column(db.Boolean, nullable=False)

class TradePair(db.Model):
    __tablename__ = 'trade_pairs'
    id = db.Column(db.Integer, primary_key=True)
    offered_instance_id = db.Column(db.Integer, db.ForeignKey('instances.instance_id'), nullable=False)
    desired_instance_id = db.Column(db.Integer, db.ForeignKey('instances.instance_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)

class Trade(db.Model):
    __tablename__ = 'trades'
    trade_id = db.Column(db.Integer, primary_key=True)
    instance_id_from_user_1 = db.Column(db.Integer, db.ForeignKey('instances.instance_id'), nullable=False)
    instance_id_from_user_2 = db.Column(db.Integer, db.ForeignKey('instances.instance_id'), nullable=False)
    user_1_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    user_2_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    status = db.Column(db.String(255))
    engagement_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)
    cancellation_date = db.Column(db.DateTime)

def init_db(app):
    with app.app_context():
        db.create_all()  # This line will create the tables if they don't exist.

