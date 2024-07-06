import connexion
import yaml
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models import db, init_db
import logging
import logging.config
import pymysql

app_conf_file = "app_conf.yml"
log_conf_file = "log_conf.yml"

# Load logging configuration dynamically
with open(log_conf_file, 'r') as log_conf_file:
    log_config = yaml.safe_load(log_conf_file)
    logging.config.dictConfig(log_config)

logger = logging.getLogger('basicLogger')

# Load database and other configuration from app_conf.yml dynamically
with open(app_conf_file, 'r') as f:
    app_config = yaml.safe_load(f)

# MySQL database connection details from app_conf.yml
db_user = app_config['database']['user']
db_password = app_config['database']['password']
db_host = app_config['database']['hostname']
db_port = app_config['database']['port']
db_name = app_config['database']['db']

# Set up the SQLAlchemy engine and session
engine = create_engine(
    f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}',
    pool_size=10,
    pool_recycle=300,
    pool_pre_ping=True
)
Session = sessionmaker(bind=engine)

def create_database():
    connection = pymysql.connect(host=db_host,
                                 user=db_user,
                                 password=db_password,
                                 charset='utf8mb4',
                                 cursorclass=pymysql.cursors.DictCursor)

    try:
        with connection.cursor() as cursor:
            sql = "CREATE DATABASE IF NOT EXISTS user_pokemon_management"
            cursor.execute(sql)
        connection.commit()
    finally:
        connection.close()

# Ensure the database is created before initializing the app
create_database()

# Create the Connexion application
app = connexion.FlaskApp(__name__, specification_dir='./')
app.add_api("openapi.yml", base_path="/user_pokemon_data", strict_validation=True, validate_responses=True)

flask_app = app.app
flask_app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(flask_app)  # Initialize SQLAlchemy with the Flask app only once here

if __name__ == "__main__":
    init_db(flask_app)  # Now this only tries to create tables, not reinitialize the db instance
    app.run(port=3002, host="0.0.0.0")