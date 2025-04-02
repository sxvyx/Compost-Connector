from mysql.connector import Error
import config

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

def calculate_environmental_impact(match_id):
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Get match and listing details
            query = """
            SELECT m.*, wl.waste_type_id, wl.quantity, wt.name as waste_type
            FROM matches m
            JOIN waste_listings wl ON m.listing_id = wl.listing_id
            JOIN waste_types wt ON wl.waste_type_id = wt.waste_type_id
            WHERE m.match_id = %s AND m.status = 'completed'
            """
            cursor.execute(query, (match_id,))
            match_data = cursor.fetchone()
            
            if not match_data:
                return None
            
            quantity = float(match_data['quantity'])
            waste_type = match_data['waste_type'].lower()
            
            # Impact factors (simplified estimates)
            if 'food' in waste_type:
                co2_saved = quantity * 2.5
                water_saved = quantity * 80
                landfill_diverted = quantity * 0.01
            elif 'yard' in waste_type or 'garden' in waste_type:
                co2_saved = quantity * 1.8
                water_saved = quantity * 30
                landfill_diverted = quantity * 0.015
            elif 'paper' in waste_type:
                co2_saved = quantity * 3.2
                water_saved = quantity * 60
                landfill_diverted = quantity * 0.02
            else:
                co2_saved = quantity * 2.0
                water_saved = quantity * 50
                landfill_diverted = quantity * 0.015
            
            # Store the calculated impact
            query = """
            INSERT INTO environmental_impact 
            (match_id, waste_type_id, quantity, co2_saved, water_saved, landfill_diverted)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (match_id, match_data['waste_type_id'], 
                                  quantity, co2_saved, water_saved, landfill_diverted))
            
            connection.commit()
            
            return {
                'match_id': match_id,
                'waste_type': match_data['waste_type'],
                'quantity': quantity,
                'co2_saved': co2_saved,
                'water_saved': water_saved,
                'landfill_diverted': landfill_diverted
            }
            
        except Error as e:
            print(f"Error calculating environmental impact: {e}")
            return None
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return None
