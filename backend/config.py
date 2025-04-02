# Database configuration settings
DB_HOST = 'localhost'
DB_NAME = 'greenhive'
DB_USER = 'root'  # replace with your MySQL username
DB_PASSWORD = 'password'  # replace with your MySQL password

# Application settings
DEBUG = True
SECRET_KEY = 'your-secret-key-here'

# Environmental impact factors
IMPACT_FACTORS = {
    'food': {
        'co2_per_kg': 2.5,
        'water_per_kg': 80
    },
    'yard': {
        'co2_per_kg': 1.8,
        'water_per_kg': 30
    },
    'paper': {
        'co2_per_kg': 3.2,
        'water_per_kg': 60
    },
    'default': {
        'co2_per_kg': 2.0,
        'water_per_kg': 50
    }
}
