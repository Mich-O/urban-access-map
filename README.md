# Urban Accessibility Map 🗺️♿

### Click below for the Demo Video: 
[Demo Video Link](https://www.loom.com/share/8e9d8cdf60d94dab8811a87d1cf1bf55)


A modern, accessible web application that helps users find wheelchair-accessible venues and routes in their community. Built with Flask, OpenStreetMap, and deployed across multiple servers with load balancing.

![Urban Access Map](https://img.shields.io/badge/Version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.8%2B-green)
![Flask](https://img.shields.io/badge/Flask-2.3.3-lightgrey)

##  Project Purpose

Urban Access Map addresses a critical need in urban mobility by providing real-time accessibility information for public venues. Unlike generic map applications, we focus specifically on wheelchair accessibility data, helping people with mobility challenges navigate cities with confidence.

### Real-World Value
- **Empowers disabled community** with reliable accessibility information
- **Crowd-sourced verification** for up-to-date accuracy
- **Smart filtering** to find truly accessible venues
- **Community reporting** for ongoing improvements

##  Features

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

## 🛠TTechnology Stack

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

##  Installation & Local Development

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/urban-access-map.git
   cd urban-access-map
