# This file contains the database models for the Community Compost Connector
# For a Flask application with direct MySQL connections, this is mainly for documentation

"""
Database Schema:

users:
- user_id (INT, PK)
- username (VARCHAR)
- password (VARCHAR, hashed)
- email (VARCHAR)
- user_type (ENUM: 'producer', 'composter')
- created_at (TIMESTAMP)

locations:
- location_id (INT, PK)
- user_id (INT, FK)
- address (VARCHAR)
- city (VARCHAR)
- state (VARCHAR)
- zipcode (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)

waste_types:
- waste_type_id (INT, PK)
- name (VARCHAR)
- description (TEXT)

waste_listings:
- listing_id (INT, PK)
- producer_id (INT, FK)
- waste_type_id (INT, FK)
- quantity (DECIMAL)
- unit (VARCHAR)
- availability_start (DATE)
- availability_end (DATE)
- pickup_time_start (TIME)
- pickup_time_end (TIME)
- status (ENUM: 'available', 'pending', 'matched', 'completed', 'expired')
- created_at (TIMESTAMP)

composter_preferences:
- preference_id (INT, PK)
- composter_id (INT, FK)
- waste_type_id (INT, FK)
- max_quantity (DECIMAL)

matches:
- match_id (INT, PK)
- listing_id (INT, FK)
- composter_id (INT, FK)
- score (DECIMAL)
- status (ENUM: 'pending', 'accepted', 'rejected', 'completed')
- created_at (TIMESTAMP)

environmental_impact:
- impact_id (INT, PK)
- match_id (INT, FK)
- waste_type_id (INT, FK)
- quantity (DECIMAL)
- co2_saved (DECIMAL)
- water_saved (DECIMAL)
- landfill_diverted (DECIMAL)
- calculated_at (TIMESTAMP)
"""
