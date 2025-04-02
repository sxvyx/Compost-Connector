import math
from mysql.connector import Error
import config

# Database connection function
def create_connection():
    try:
        import mysql.connector
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

# Helper function to calculate distance between two points
def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance between two points
    R = 6371  # Radius of the Earth in km
    dLat = math.radians(float(lat2) - float(lat1))
    dLon = math.radians(float(lon2) - float(lon1))
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    return distance

def find_matches(listing_id):
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Get listing details
            query = """
            SELECT l.*, wt.name as waste_type, u.user_id as producer_id, 
                   loc.latitude as producer_lat, loc.longitude as producer_lon
            FROM waste_listings l
            JOIN waste_types wt ON l.waste_type_id = wt.waste_type_id
            JOIN users u ON l.producer_id = u.user_id
            JOIN locations loc ON u.user_id = loc.user_id
            WHERE l.listing_id = %s
            """
            cursor.execute(query, (listing_id,))
            listing = cursor.fetchone()
            
            if not listing:
                return []
            
            # Find potential composters based on waste type and preferences
            query = """
            SELECT u.user_id as composter_id, u.username as composter_name,
                   cp.max_quantity, loc.latitude as composter_lat, 
                   loc.longitude as composter_lon
            FROM users u
            JOIN composter_preferences cp ON u.user_id = cp.composter_id
            JOIN locations loc ON u.user_id = loc.user_id
            WHERE u.user_type = 'composter'
            AND cp.waste_type_id = %s
            AND (cp.max_quantity IS NULL OR cp.max_quantity >= %s)
            """
            cursor.execute(query, (listing['waste_type_id'], listing['quantity']))
            composters = cursor.fetchall()
            
            # Calculate scores and find best matches
            matches = []
            for comp in composters:
                if comp['composter_lat'] and comp['composter_lon'] and listing['producer_lat'] and listing['producer_lon']:
                    # Calculate distance (in km)
                    distance = calculate_distance(
                        float(listing['producer_lat']), float(listing['producer_lon']),
                        float(comp['composter_lat']), float(comp['composter_lon'])
                    )
                    
                    # Calculate capacity match (how close to max capacity)
                    capacity_score = 1.0
                    if comp['max_quantity']:
                        capacity_ratio = float(listing['quantity']) / float(comp['max_quantity'])
                        # Prefer composters who will be closer to full capacity
                        capacity_score = min(1.0, capacity_ratio * 1.5)
                    
                    # Calculate final score with weights
                    # Distance is inversely weighted (closer is better)
                    distance_weight = 0.6
                    capacity_weight = 0.4
                    
                    # Convert distance to a 0-1 score (10km or more = 0, 0km = 1)
                    distance_score = max(0, 1 - (distance / 10))
                    
                    final_score = (distance_weight * distance_score) + (capacity_weight * capacity_score)
                    
                    matches.append({
                        'composter_id': comp['composter_id'],
                        'composter_name': comp['composter_name'],
                        'distance': distance,
                        'capacity_score': capacity_score,
                        'final_score': final_score,
                        'listing_id': listing_id
                    })
            
            # Sort by final score (highest first)
            matches.sort(key=lambda x: x['final_score'], reverse=True)
            
            # Create match records for top 3 matches
            for match in matches[:3]:
                query = """
                INSERT INTO matches (listing_id, composter_id, score)
                VALUES (%s, %s, %s)
                """
                cursor.execute(query, (match['listing_id'], match['composter_id'], match['final_score']))
            
            connection.commit()
            return matches
            
        except Error as e:
            print(f"Error in matching algorithm: {e}")
            return []
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return []
