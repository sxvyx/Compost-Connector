 # 🌱 Compost Connector

**Compost Connector Named GreenHive** is a web-based platform that connects waste producers with composters, facilitating the efficient recycling of organic waste into valuable compost. This project was developed as part of the **Smart Instinct Initiative : Code Blind Contest** at SRM AP University.

---

## 🚀 Overview
Compost Connector addresses the growing challenge of **food waste management** by creating a marketplace where:

- 🏡 **Households** can register to receive bins and schedule regular waste collections.
- 🍽️ **Commercial entities** (restaurants, cafes, cloud kitchens) can list their organic waste.
- ♻️ **Composters** can find and collect organic waste based on their preferences.
- 🌿 **Buyers** can purchase finished compost for gardening and farming.

✨ The platform includes an **intelligent matching algorithm** that connects waste producers with nearby composters, tracks environmental impact, and promotes sustainable waste management practices.

---

## 🔥 Features
✅ User registration & authentication for different user types  
✅ Waste listing creation and management  
✅ **Smart Matching Algorithm** based on location & waste type  
✅ Environmental impact tracking & visualization  
✅ **Interactive dashboards** for all user types  

---

## 🛠️ Technology Stack
- 🎨 **Frontend:** HTML, CSS, JavaScript, Bootstrap
- 🖥️ **Backend:** Python, Flask
- 🗄️ **Database:** MySQL
- 📍 **APIs:** Geolocation services for distance calculation

---

## ⚙️ Installation Guide
### 🔹 Prerequisites
Make sure you have the following installed:
- 🐍 Python 3.8 or higher
- 🗄️ MySQL 8.0 or higher
- 📦 pip (Python package manager)

### 🔹 Setup Instructions
#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/compost-connector.git
cd compost-connector
```

#### 2️⃣ Create and Activate a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4️⃣ Set Up the Database
```bash
mysql -u root -p
CREATE DATABASE greenhive;
exit;
```

#### 5️⃣ Import the Database Schema
```bash
mysql -u yourusername -p greenhive < database/schema.sql
```

#### 6️⃣ Configure the Application
Create a `config.py` file in the root directory with the following content:
```python
# Database configuration
DB_HOST = 'localhost'
DB_USER = 'yourusername'
DB_PASSWORD = 'yourpassword'
DB_NAME = 'greenhive'
```

#### 7️⃣ Run the Application
```bash
python app.py
```

#### 8️⃣ Access the Application
🌍 Open your web browser and navigate to: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📌 Project Status
This project is currently a **prototype** with the following features:

✅ **User registration & authentication** - Fully functional  
✅ **Waste listing creation & viewing** - Works as expected  
✅ **Matching algorithm** - Implemented (optimization needed)  
✅ **Environmental impact calculation** - Based on simplified formulas  

### 🚀 Future Enhancements
## Can be implemented But with a time constraint we just can do this
🔜 IoT integration for **real-time bin monitoring**  
🔜 **Mobile application** for easier access  
🔜 **Payment gateway integration** for compost purchases  
🔜 **Advanced route optimization** for waste collection  

---

## 🏆 Contributing
We welcome contributions! Feel free to **fork** the repository and submit a **pull request**.

---

💡 **Let's build a greener future together! 🌍♻️**
