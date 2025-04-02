from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
from matching_algorithm import find_matches
from impact_calculator import calculate_environmental_impact
import config
from geopy.geocoders import Nominatim

app = Flask(__name__, static_folder='C:/GreenHive/frontend/static',  # replace with your directory
            template_folder='C:/GreenHive/frontend')  # replace with your directory
CORS(app)  # Enable CORS for all routes

# Database connection function
def create_connection():
    try:
        connection = mysql.connector.connect(
            host=config.DB_HOST,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def get_coordinates(address):
    geolocator = Nominatim(user_agent="community_compost_connector")
    location = geolocator.geocode(address)
    if location:
        return location.latitude, location.longitude
    return None, None

# Root route
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/index.html')
def index_html():
    return render_template('index.html')

# Additional routes for HTML pages
@app.route('/dashboard')
@app.route('/dashboard.html')
def dashboard():
    return render_template('dashboard.html')

@app.route('/login')
@app.route('/login.html')
def login():
    return render_template('login.html')

@app.route('/register')
@app.route('/register.html')
def register():
    user_type = request.args.get('type', 'producer')
    return render_template('register.html', user_type=user_type)

@app.route('/listing_form')
@app.route('/listing_form.html')
def listing_form():
    return render_template('listing_form.html')

@app.route('/matches')
@app.route('/matches.html')
def matches():
    return render_template('matches.html')

@app.route('/impact')
@app.route('/impact.html')
def impact():
    return render_template('impact.html')

# User registration
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    
    # Validate required fields
    required_fields = ['username', 'password', 'email', 'user_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Hash the password
    hashed_password = generate_password_hash(data['password'])
    
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            # Insert user
            query = """
            INSERT INTO users (username, password, email, user_type)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (data['username'], hashed_password,
                                  data['email'], data['user_type']))
            user_id = cursor.lastrowid
            
            # Insert location if provided
            if 'location' in data:
                loc = data['location']
                full_address = f"{loc.get('address', '')}, {loc.get('city', '')}, {loc.get('state', '')}, {loc.get('zipcode', '')}"
                latitude, longitude = get_coordinates(full_address)
                
                query = """
                INSERT INTO locations (user_id, address, city, state, zipcode, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (user_id, loc.get('address', ''),
                               loc.get('city', ''), loc.get('state', ''),
                               loc.get('zipcode', ''), latitude, longitude))
            
            # Insert composter preferences if applicable
            if data['user_type'] == 'composter' and 'preferences' in data:
                for pref in data['preferences']:
                    query = """
                    INSERT INTO composter_preferences (composter_id, waste_type_id, max_quantity)
                    VALUES (%s, %s, %s)
                    """
                    cursor.execute(query, (user_id, pref['waste_type_id'],
                                          pref.get('max_quantity')))
            
            connection.commit()
            return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
            
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# User login
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json
    
    if 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400
        
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            query = """
            SELECT user_id, username, password, email, user_type
            FROM users
            WHERE username = %s
            """
            cursor.execute(query, (data['username'],))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password'], data['password']):
                # Remove password from response
                user.pop('password', None)
                return jsonify({'message': 'Login successful', 'user': user}), 200
            else:
                return jsonify({'error': 'Invalid username or password'}), 401
                
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Get waste types
@app.route('/api/waste-types', methods=['GET'])
def get_waste_types():
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = "SELECT * FROM waste_types"
            cursor.execute(query)
            waste_types = cursor.fetchall()
            return jsonify(waste_types), 200
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Create waste listing
@app.route('/api/listings', methods=['GET', 'POST'])
def create_listing():
    if request.method == 'POST':
        data = request.json
        
        # Validate required fields
        required_fields = ['producer_id', 'waste_type_id', 'quantity', 'unit', 
                          'availability_start', 'availability_end']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        connection = create_connection()
        if connection:
            try:
                cursor = connection.cursor()
                
                # Insert listing
                query = """
                INSERT INTO waste_listings (producer_id, waste_type_id, quantity, unit, 
                                          availability_start, availability_end,
                                          pickup_time_start, pickup_time_end, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (data['producer_id'], data['waste_type_id'], 
                                      data['quantity'], data['unit'],
                                      data['availability_start'], data['availability_end'],
                                      data.get('pickup_time_start'), data.get('pickup_time_end'),
                                      'available'))  # Add default status
                
                listing_id = cursor.lastrowid
                connection.commit()
                
                # Trigger matching algorithm
                matches = find_matches(listing_id)
                
                return jsonify({'message': 'Listing created successfully', 'listing_id': listing_id}), 201
                
            except Error as e:
                app.logger.error(f"Error creating listing: {str(e)}")
                return jsonify({'error': str(e)}), 500
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
        else:
            return jsonify({'error': 'Database connection failed'}), 500
    
    elif request.method == 'GET':
        # Handle GET request - return listings for a producer
        producer_id = request.args.get('producer_id')
        if not producer_id:
            return jsonify({'error': 'Producer ID is required'}), 400
            
        connection = create_connection()
        if connection:
            try:
                cursor = connection.cursor(dictionary=True)
                
                query = """
                SELECT wl.*, wt.name as waste_type
                FROM waste_listings wl
                JOIN waste_types wt ON wl.waste_type_id = wt.waste_type_id
                WHERE wl.producer_id = %s
                ORDER BY wl.created_at DESC
                """
                cursor.execute(query, (producer_id,))
                listings = cursor.fetchall()
                
                # Convert datetime objects to strings for JSON serialization
                for listing in listings:
                    # Handle datetime objects
                    for key in ['created_at', 'availability_start', 'availability_end']:
                        if key in listing and listing[key] is not None:
                            if isinstance(listing[key], datetime):
                                listing[key] = listing[key].isoformat()
                    
                    # Handle timedelta objects (pickup times)
                    for key in ['pickup_time_start', 'pickup_time_end']:
                        if key in listing and listing[key] is not None:
                            if hasattr(listing[key], 'total_seconds'):  # Check if it's a timedelta
                                total_seconds = int(listing[key].total_seconds())
                                hours, remainder = divmod(total_seconds, 3600)
                                minutes, seconds = divmod(remainder, 60)
                                listing[key] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                
                return jsonify(listings), 200
                
            except Error as e:
                app.logger.error(f"Database error: {str(e)}")
                return jsonify({'error': str(e)}), 500
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
        else:
            return jsonify({'error': 'Database connection failed'}), 500




# Get available listings with time filters
@app.route('/api/listings/available', methods=['GET'])
def get_available_listings():
    try:
        # Get filter parameters
        waste_type_id = request.args.get('waste_type_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        time_from = request.args.get('time_from')
        time_to = request.args.get('time_to')
        
        app.logger.info(f"Fetching available listings with date_from={date_from}")
        
        connection = create_connection()
        if connection:
            try:
                cursor = connection.cursor(dictionary=True)
                
                # Build query with filters
                query = """
                SELECT wl.*, wt.name as waste_type,
                       u.username as producer_name, u.email as producer_email,
                       loc.city, loc.state, loc.zipcode
                FROM waste_listings wl
                JOIN waste_types wt ON wl.waste_type_id = wt.waste_type_id
                JOIN users u ON wl.producer_id = u.user_id
                LEFT JOIN locations loc ON u.user_id = loc.user_id
                WHERE wl.status = 'available'
                """
                params = []
                
                # Add time and date filters
                if waste_type_id:
                    query += " AND wl.waste_type_id = %s"
                    params.append(waste_type_id)
                    
                if date_from:
                    query += " AND wl.availability_end >= %s"
                    params.append(date_from)
                    
                if date_to:
                    query += " AND wl.availability_start <= %s"
                    params.append(date_to)
                    
                if time_from:
                    query += " AND (wl.pickup_time_end IS NULL OR wl.pickup_time_end >= %s)"
                    params.append(time_from)
                    
                if time_to:
                    query += " AND (wl.pickup_time_start IS NULL OR wl.pickup_time_start <= %s)"
                    params.append(time_to)
                    
                # Order by newest first
                query += " ORDER BY wl.created_at DESC"
                
                app.logger.debug(f"Query: {query}")
                app.logger.debug(f"Params: {params}")
                
                cursor.execute(query, tuple(params))
                listings = cursor.fetchall()
                
                # Convert datetime objects to strings for JSON serialization
                for listing in listings:
                    if 'created_at' in listing and listing['created_at']:
                        listing['created_at'] = listing['created_at'].isoformat()
                    if 'availability_start' in listing and listing['availability_start']:
                        listing['availability_start'] = listing['availability_start'].isoformat()
                    if 'availability_end' in listing and listing['availability_end']:
                        listing['availability_end'] = listing['availability_end'].isoformat()
                
                app.logger.info(f"Found {len(listings)} available listings")
                return jsonify(listings), 200
                
            except Error as e:
                app.logger.error(f"Database error: {str(e)}")
                return jsonify({'error': str(e)}), 500
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
        else:
            app.logger.error("Database connection failed")
            return jsonify({'error': 'Database connection failed'}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Get matches for a user
@app.route('/api/matches/<int:user_id>', methods=['GET'])
def get_matches(user_id):
    user_type = request.args.get('type')
    if user_type not in ['producer', 'composter']:
        return jsonify({'error': 'Invalid user type'}), 400
        
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            if user_type == 'producer':
                query = """
                SELECT m.*, wl.waste_type_id, wl.quantity, wl.unit,
                       u.username as composter_name, u.email as composter_email
                FROM matches m
                JOIN waste_listings wl ON m.listing_id = wl.listing_id
                JOIN users u ON m.composter_id = u.user_id
                WHERE wl.producer_id = %s
                """
                cursor.execute(query, (user_id,))
            else:  # composter
                query = """
                SELECT m.*, wl.waste_type_id, wl.quantity, wl.unit,
                       u.username as producer_name, u.email as producer_email
                FROM matches m
                JOIN waste_listings wl ON m.listing_id = wl.listing_id
                JOIN users u ON wl.producer_id = u.user_id
                WHERE m.composter_id = %s
                """
                cursor.execute(query, (user_id,))
                
            matches = cursor.fetchall()
            return jsonify(matches), 200
            
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Update match status
@app.route('/api/matches/<int:match_id>', methods=['PUT'])
def update_match(match_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
        
    if data['status'] not in ['accepted', 'rejected', 'completed']:
        return jsonify({'error': 'Invalid status'}), 400
        
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            query = """
            UPDATE matches
            SET status = %s
            WHERE match_id = %s
            """
            cursor.execute(query, (data['status'], match_id))
            
            # If accepted or completed, update the listing status
            if data['status'] in ['accepted', 'completed']:
                listing_status = 'matched' if data['status'] == 'accepted' else 'completed'
                query = """
                UPDATE waste_listings wl
                JOIN matches m ON wl.listing_id = m.listing_id
                SET wl.status = %s
                WHERE m.match_id = %s
                """
                cursor.execute(query, (listing_status, match_id))
                
            # If completed, calculate environmental impact
            if data['status'] == 'completed':
                calculate_environmental_impact(match_id)
                
            connection.commit()
            return jsonify({'message': f'Match status updated to {data["status"]}'}), 200
            
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Get impact statistics for a specific user
@app.route('/api/impact/user/<int:user_id>', methods=['GET'])
def get_user_impact(user_id):
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = """
            SELECT 
                SUM(ei.quantity) as total_waste_diverted,
                SUM(ei.co2_saved) as total_co2_saved,
                SUM(ei.water_saved) as total_water_saved,
                COUNT(DISTINCT ei.match_id) as total_matches
            FROM environmental_impact ei
            JOIN matches m ON ei.match_id = m.match_id
            JOIN waste_listings wl ON m.listing_id = wl.listing_id
            WHERE wl.producer_id = %s OR m.composter_id = %s
            """
            cursor.execute(query, (user_id, user_id))
            impact = cursor.fetchone()
            
            # Handle null values
            if impact['total_waste_diverted'] is None:
                impact['total_waste_diverted'] = 0
            if impact['total_co2_saved'] is None:
                impact['total_co2_saved'] = 0
            if impact['total_water_saved'] is None:
                impact['total_water_saved'] = 0
            if impact['total_matches'] is None:
                impact['total_matches'] = 0
                
            return jsonify(impact), 200
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Get impact statistics
@app.route('/api/impact/stats', methods=['GET'])
def get_impact_stats():
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = """
            SELECT
                SUM(quantity) as total_waste_diverted,
                SUM(co2_saved) as total_co2_saved,
                SUM(water_saved) as total_water_saved,
                SUM(landfill_diverted) as total_landfill_diverted,
                COUNT(DISTINCT match_id) as total_successful_matches
            FROM environmental_impact
            """
            cursor.execute(query)
            stats = cursor.fetchone()
            return jsonify(stats), 200
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500


# Get impact breakdown by waste type
@app.route('/api/impact/breakdown', methods=['GET'])
def get_impact_breakdown():
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = """
            SELECT 
                wt.name as waste_type,
                SUM(ei.quantity) as quantity,
                SUM(ei.co2_saved) as co2_saved,
                SUM(ei.water_saved) as water_saved
            FROM environmental_impact ei
            JOIN matches m ON ei.match_id = m.match_id
            JOIN waste_listings wl ON m.listing_id = wl.listing_id
            JOIN waste_types wt ON ei.waste_type_id = wt.waste_type_id
            GROUP BY wt.name
            ORDER BY SUM(ei.quantity) DESC
            """
            cursor.execute(query)
            breakdown = cursor.fetchall()
            return jsonify(breakdown), 200
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500


# Add test waste types (for development)
@app.route('/api/test/waste-types', methods=['GET', 'POST'])
def add_test_waste_types():
    waste_types = [
        {'name': 'Food Scraps', 'description': 'Fruit and vegetable peels, coffee grounds, etc.'},
        {'name': 'Yard Waste', 'description': 'Leaves, grass clippings, small branches'},
        {'name': 'Paper Products', 'description': 'Cardboard, newspaper, non-glossy paper'},
        {'name': 'Eggshells', 'description': 'Clean eggshells crushed or whole'},
        {'name': 'Coffee Grounds', 'description': 'Used coffee grounds and filters'},
        {'name': 'Tea Bags', 'description': 'Used tea bags without staples'},
        {'name': 'Fruit Peels', 'description': 'Banana peels, orange rinds, apple cores'},
        {'name': 'Vegetable Scraps', 'description': 'Carrot tops, potato peels, onion skins'}
    ]
    
    # For GET requests, just return the list of waste types
    if request.method == 'GET':
        connection = create_connection()
        if connection:
            try:
                cursor = connection.cursor(dictionary=True)
                # Check if waste types already exist
                cursor.execute("SELECT COUNT(*) as count FROM waste_types")
                count = cursor.fetchone()['count']
                
                if count > 0:
                    return jsonify({'message': f'{count} waste types already exist in the database'}), 200
                
                # If no waste types exist, add them
                for wt in waste_types:
                    query = "INSERT INTO waste_types (name, description) VALUES (%s, %s)"
                    cursor.execute(query, (wt['name'], wt['description']))
                
                connection.commit()
                return jsonify({'message': 'Test waste types added successfully'}), 201
            except Error as e:
                return jsonify({'error': str(e)}), 500
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
        else:
            return jsonify({'error': 'Database connection failed'}), 500
    
    # For POST requests, add the waste types
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            for wt in waste_types:
                query = "INSERT INTO waste_types (name, description) VALUES (%s, %s)"
                cursor.execute(query, (wt['name'], wt['description']))
            
            connection.commit()
            return jsonify({'message': 'Test waste types added successfully'}), 201
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)
