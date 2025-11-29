# Urban Accessibility Map 🗺️♿

### Click below for the Demo Video: 
[Demo Video Link](https://www.loom.com/share/8e9d8cdf60d94dab8811a87d1cf1bf55)


A modern, accessible web application that helps users find wheelchair-accessible venues and routes in their community. Built with Flask, OpenStreetMap, and deployed across multiple servers with load balancing.

![Urban Accessibility Map](https://img.shields.io/badge/Version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.8%2B-green)
![Flask](https://img.shields.io/badge/Flask-2.3.3-lightgrey)

## 🎯 Project Purpose

Urban Accessibility Map addresses a critical need in urban mobility by providing real-time accessibility information for public venues. Unlike generic map applications, we focus specifically on wheelchair accessibility data, helping people with mobility challenges navigate cities with confidence.

### Real-World Value
- **Empowers disabled community** with reliable accessibility information
- **Crowd-sourced verification** for up-to-date accuracy
- **Smart filtering** to find truly accessible venues
- **Community reporting** for ongoing improvements

## 🚀 Features

### Core Functionality
- **Interactive Map**: OpenStreetMap-based with custom accessibility markers
- **Smart Search**: Location search using OpenStreetMap Nominatim API
- **Accessibility Filtering**: Filter venues by wheelchair accessibility status
- **Real-time Data**: Live OpenStreetMap amenities data
- **User Reporting**: Crowd-sourced accessibility issue reporting

### User Experience
- **Mobile-First Design**: Responsive across all devices
- **Modern UI**: Google DeepMind-inspired clean interface
- **Fast Performance**: Optimized API calls and caching
- **Intuitive Controls**: Simple, accessible user interface

## 🛠️ Technology Stack

### Backend
- **Python 3.8+** with **Flask** web framework
- **SQLite** database for user reports
- **Gunicorn** WSGI server for production
- **Nginx** reverse proxy and static file serving

### Frontend
- **Vanilla JavaScript** with Leaflet.js for mapping
- **Modern CSS3** with Google DeepMind-inspired design
- **Science Gothic** typography for premium feel
- **Responsive Grid** layout

### APIs Used
- **OpenStreetMap Tile Server** - Map tiles (free, no API key)
- **Overpass API** - Amenities and accessibility data (free, no API key)
- **Nominatim API** - Location search (free, no API key)

## 📦 Installation & Local Development

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Local Setup

1. **Clone the repository**
   
         git clone https://github.com/Mich-O/urban-accessibility_summative_assignment.git
         cd urban-accessibility_summative_assignment

2. **Create virtual environment**
   
         python3 -m venv venv
         source venv/bin/activate  # On Windows: venv\Scripts\activate

3. **Install dependencies**

         pip install -r requirements.txt

4. **Initialize database**

         python init_db.py

5. **Run the application**

         python app.py

6. **Access the application**
Open http://localhost:5000 in your browser

## Project Structure

      urban-accessibility_summative_assignment/
      ├── app.py                 # Main Flask application
      ├── init_db.py            # Database initialization
      ├── requirements.txt       # Python dependencies
      ├── README.md               # Documentation
      ├── .gitignore            # Git ignore rules
      ├── static/
      │   ├── css/
      │   │   └── style.css     # Modern CSS styling
      │   └── js/
      │       └── map.js        # Interactive map functionality
      ├── templates/
      │   └── index.html        # Main template
      └── instance/
          └── accessibility.db  # SQLite database (created automatically)
    
## 🌐 Deployment


### Server Architecture

- 2 Web Servers (web-01, web-02): Host Flask application

- 1 Load Balancer (lb-01): Distributes traffic using HAProxy

- Nginx: Reverse proxy and static file serving

- Gunicorn: Python WSGI HTTP server


### Deployment Steps

1. **Web Server Setup (web-01 & web-02)**
   
**System Preparation**

      sudo apt update && sudo apt upgrade -y
      sudo apt install python3 python3-pip python3-venv nginx git -y

**Application Deployment**

      sudo mkdir -p /var/www/urban-access-map
      sudo chown $USER:$USER /var/www/urban-access-map
      cd /var/www/urban-access-map
      git clone https://github.com/Mich-O/urban-accessibility_summative_assignment.git .
      python3 -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt

**Systemd Service (/etc/systemd/system/urban-accessibility.service)**

      [Unit]
      Description=Gunicorn service for Urban Accessibility Flask App
      After=network.target
      
      [Service]
      User=ubuntu
      Group=www-data
      WorkingDirectory=/var/www/urban-access-map
      Environment="PATH=/var/www/urban-access-map/venv/bin"
      ExecStart=/var/www/urban-access-map/venv/bin/gunicorn \
                --workers 3 \
                --bind unix:/var/www/urban-access-map/urban.sock \
                app:app
      
      [Install]
      WantedBy=multi-user.target


**Nginx Configuration (/etc/nginx/sites-available/urban-accessibility)**

      server {
          listen 80;
          server_name _;  # Use "_" if no specific domain is assigned
      
          add_header X-Served-By web01;      # Change to web-02 on other server.
      
          # Serve static files directly
          location /static/ {
              alias /var/www/urban-access-map/static/;
          }
      
          # Pass all other requests to Gunicorn via the Unix socket
          location / {
              include proxy_params;
      
              # Preserve real client IP and protocol from HAProxy
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      
              proxy_pass http://unix:/var/www/urban-access-map/urban.sock;
          }
      
          # Optional: increase buffer size for larger requests
          client_max_body_size 20M;
      
          # Optional: enable gzip for static files
          gzip on;
          gzip_types text/css application/javascript application/json image/svg+xml;
          gzip_min_length 256;
      }


**Enable Services**

      sudo ln -s /etc/nginx/sites-available/urban-accessibility /etc/nginx/sites-enabled/
      sudo nginx -t
      sudo systemctl reload nginx
      sudo systemctl start urban-accessibility
      sudo systemctl enable urban-accessibility

2. **Load Balancer Setup (lb-01)**
   
Install HAProxy

         sudo apt update && sudo apt install haproxy -y
         HAProxy Configuration (/etc/haproxy/haproxy.cfg)

configure haproxy (/etc/haproxy/haproxy.cfg)

      # Global settings
      global
          log /dev/log local0
          log /dev/log local1 notice
          daemon
          maxconn 256
          tune.ssl.default-dh-param 2048
      
      defaults
          log global
          mode http
          option httplog
          option dontlognull
          timeout connect 5000ms
          timeout client 50000ms
          timeout server 50000ms
      
      # ----------------------------
      # Redirect all HTTP → HTTPS
      # ----------------------------
      frontend http_front
          bind *:80
          mode http
          redirect scheme https code 301 if !{ ssl_fc }
      
      # ----------------------------
      # HTTPS Frontend
      # ----------------------------
      frontend https_front
          bind *:443 ssl crt /etc/haproxy/certs/www.michaelokinyi.tech.pem
          mode http
          default_backend web_back
      
      # ----------------------------
      # Backend (web servers)
      # ----------------------------
      backend web_back
          mode http
          balance roundrobin
          
          server web01 54.204.69.144:80 check
          server web02 52.91.224.14:80 check
          
      #listen stats   
      #    bind *:8404
      #    mode http
      #    stats enable
      #    stats uri /    # Access via http://44.203.59.152:8404/
      #    stats refresh 10
      #    stats auth user:your-secure-password

    
**Enable HAProxy**

      sudo systemctl enable haproxy
      sudo systemctl start haproxy

 ### Verification Steps
 
 
1. **Test individual servers:**

         curl http://54.204.69.144
         curl http://52.91.224.14


2. **Test load balancer:**

         curl http://44.203.59.152
   

3.**Monitor traffic distribution:**  # Note the server alternations

      curl -sI https://michelokinyi.tech 
      

# 🔧 API Documentation

## Endpoints 

**GET** /api/amenities
Fetch nearby amenities with accessibility information.

Parameters:

- lat (float): Latitude

- lon (float): Longitude

- radius (int, optional): Search radius in meters (default: 500)

**Response:**

json

      [
        {
          "type": "node",
          "id": 123456,
          "lat": 40.7128,
          "lon": -74.0060,
          "tags": {
            "amenity": "restaurant",
            "name": "Example Restaurant",
            "wheelchair": "yes"
          }
        }
      ]           



**POST** /api/reports
Submit accessibility issue reports.

**Request Body:**

json

      {
        "lat": 40.7128,
        "lon": -74.0060,
        "issue_type": "stairs",
        "description": "No ramp at entrance"
      }           

**Response:**

json

      {
        "status": "success"
      }


**GET** /api/reports
Retrieve all submitted reports.


## 🎨 User Interaction Features


### Data Filtering & Sorting

- Wheelchair Status: Filter by accessible, not accessible, or unknown

- Venue Type: Filter by specific amenity types (restaurant, cafe, etc.)

- Text Search: Search within venue names

- Real-time Updates: Filters apply immediately to map and list


### Data Presentation

- Color-coded Markers: Green (accessible), Red (not accessible), Gray (unknown)

- Interactive List: Clickable sidebar with all venues

- Detailed Popups: Comprehensive accessibility information

- Statistics Display: Count of accessible vs non-accessible venues


### Error Handling

- Graceful API Failures: Empty results instead of errors

- User-friendly Messages: Clear error explanations

- Loading States: Visual feedback during operations

- Input Validation: Client and server-side validation


## 🔒 Security & Best Practices

### API Security

- Input validation on all endpoints

- SQL injection prevention through parameterized queries

- Rate limiting consideration for production deployment


### Data Privacy

- No personal data collection

- Anonymous reporting system

- Local database storage only


### Production Considerations

- Environment variables for configuration

- Gunicorn with multiple workers for performance

- Nginx static file caching

- HAProxy load distribution


## 🚀 Bonus Features Implemented

### Enhanced User Experience

- Responsive Design: Mobile-first approach with 4 breakpoints

- Modern UI: Google DeepMind-inspired interface with Science Gothic typography

- Advanced Filtering: Multi-criteria venue filtering

- Search Integration: Global location search

### Performance Optimizations

Efficient API Calls: Smart caching and error handling



## 📝 Development Challenges & Solutions

### Challenge 1: OpenStreetMap API Reliability

Problem: Overpass API frequently returned timeouts or 504 errors.

Solution:

- Implemented multiple endpoint fallbacks

- Simplified queries to reduce complexity

- Added graceful error handling with empty result returns


### Challenge 2: Cross-Platform Deployment

Problem: Database locking issues between WSL and Windows environments.

Solution:

- Standardized on WSL development environment

- Implemented proper database connection handling

- Created clear deployment documentation


### Challenge 3: Real-time Data Filtering

Problem: Maintaining performance with large datasets and complex filters.

Solution:

- Client-side filtering for instant response

- Efficient marker management with proper cleanup

- Debounced search inputs


## 🤝 Contributing

1. Fork the repository

2. Create a feature branch (git checkout -b feature/amazing-feature)

3. Commit your changes (git commit -m 'Add amazing feature')

4. Push to the branch (git push origin feature/amazing-feature)

5. Open a Pull Request


📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


## 🙏 Acknowledgments

OpenStreetMap for providing free map data and APIs

Leaflet.js for the excellent mapping library

Google Fonts for the Science Gothic typeface

Flask community for the robust web framework



                                                               Built with ♥ for accessible communities
