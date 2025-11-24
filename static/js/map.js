let map;
let userMarker;
let amenityMarkers = [];
let reportMarkers = [];
let allAmenities = [];
let amenitiesLoaded = false;

function initMap() {
    map = L.map('map').setView([-1.9434, 30.1288], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    setupEventListeners();
    loadExistingReports();
}

function setupEventListeners() {
    document.getElementById('locate').addEventListener('click', locateUser);
    document.getElementById('load-amenities').addEventListener('click', loadAmenitiesForCurrentView);
    document.getElementById('report').addEventListener('click', showReportModal);
    document.getElementById('cancel-report').addEventListener('click', hideReportModal);
    document.getElementById('report-form').addEventListener('submit', submitReport);
    document.getElementById('search-btn').addEventListener('click', searchLocation);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation();
    });
    
    document.getElementById('wheelchair-filter').addEventListener('change', applyFilters);
    document.getElementById('type-filter').addEventListener('change', applyFilters);
    document.getElementById('search-amenities').addEventListener('input', applyFilters);
    
    map.on('moveend', () => {
        if (amenitiesLoaded) {
            loadAmenitiesForCurrentView();
        }
    });
}

async function searchLocation() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    try {
        showLoadingState(true);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length > 0) {
            const result = results[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            map.setView([lat, lon], 14);
            document.getElementById('search-input').value = result.display_name;
        } else {
            alert('Location not found');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Error searching for location');
    } finally {
        showLoadingState(false);
    }
}

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                userMarker = L.marker(userLocation)
                    .addTo(map)
                    .bindPopup('You are here')
                    .openPopup();
                
                map.setView(userLocation, 16);
            },
            (error) => {
                alert('Location access denied or unavailable');
            }
        );
    }
}

function loadAmenitiesForCurrentView() {
    const center = map.getCenter();
    loadNearbyAmenities(center);
}

function loadNearbyAmenities(location) {
    if (!location || !location.lat || !location.lng) {
        showError('Invalid location');
        return;
    }

    showLoadingState(true);
    
    const radius = 1000;
    
    fetch(`/api/amenities?lat=${location.lat}&lon=${location.lng}&radius=${radius}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(amenities => {
            if (amenities && amenities.error) {
                throw new Error(amenities.error);
            }
            
            if (!Array.isArray(amenities)) {
                throw new Error('Invalid response from server');
            }
            
            allAmenities = amenities;
            amenitiesLoaded = true;
            displayAmenities(amenities);
            updateAmenityTypesFilter(amenities);
            showLoadingState(false);
        })
        .catch(error => {
            console.error('Error loading amenities:', error);
            showError(`Temporary server issue - showing empty results`);
            showLoadingState(false);
            allAmenities = [];
            displayAmenities([]); // Show empty state
        });
}

function displayAmenities(amenities) {
    clearAmenityMarkers();
    
    amenities.forEach(amenity => {
        const lat = amenity.lat || (amenity.center && amenity.center.lat);
        const lon = amenity.lon || (amenity.center && amenity.center.lon);
        
        if (lat && lon) {
            const wheelchair = amenity.tags.wheelchair;
            const amenityType = amenity.tags.amenity || 'unknown';
            
            let iconColor = 'gray';
            if (wheelchair === 'yes') iconColor = 'green';
            if (wheelchair === 'no') iconColor = 'red';
            
            const marker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: `amenity-marker ${wheelchair}`,
                    html: `<div style="background: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [16, 16]
                })
            }).addTo(map);
            
            const name = amenity.tags.name || 'Unnamed Venue';
            
            marker.bindPopup(`
                <strong>${name}</strong><br>
                Type: ${amenityType}<br>
                Wheelchair: ${wheelchair || 'unknown'}
            `);
            
            marker.on('click', () => {
                map.setView([lat, lon], 16);
            });
            
            amenityMarkers.push(marker);
        }
    });
    
    updateAmenitiesList(amenities);
}

function updateAmenitiesList(amenities) {
    const container = document.getElementById('amenities-container');
    const countElement = document.getElementById('amenities-count');
    
    countElement.textContent = `(${amenities.length})`;
    
    if (amenities.length === 0) {
        container.innerHTML = '<div class="error-message">No amenities found in this area</div>';
        return;
    }
    
    container.innerHTML = amenities.map(amenity => {
        const name = amenity.tags.name || 'Unnamed Venue';
        const type = amenity.tags.amenity || 'Unknown';
        const wheelchair = amenity.tags.wheelchair || 'unknown';
        const lat = amenity.lat || (amenity.center && amenity.center.lat);
        const lon = amenity.lon || (amenity.center && amenity.center.lon);
        
        let accessibilityClass = '';
        if (wheelchair === 'yes') accessibilityClass = 'accessible';
        if (wheelchair === 'no') accessibilityClass = 'not-accessible';
        
        return `
            <div class="amenity-item ${accessibilityClass}" 
                 onclick="centerOnAmenity(${lat}, ${lon})">
                <div class="amenity-name">${name}</div>
                <div class="amenity-details">
                    ${type} • ${wheelchair === 'yes' ? '♿ Accessible' : wheelchair === 'no' ? '❌ Not Accessible' : '❓ Unknown'}
                </div>
            </div>
        `;
    }).join('');
}

function centerOnAmenity(lat, lon) {
    map.setView([lat, lon], 16);
}

function updateAmenityTypesFilter(amenities) {
    const typeFilter = document.getElementById('type-filter');
    const types = [...new Set(amenities.map(a => a.tags.amenity).filter(Boolean))];
    
    typeFilter.innerHTML = '<option value="all">All Types</option>' +
        types.map(type => `<option value="${type}">${type}</option>`).join('');
}

function applyFilters() {
    const wheelchairFilter = document.getElementById('wheelchair-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const searchFilter = document.getElementById('search-amenities').value.toLowerCase();
    
    const filteredAmenities = allAmenities.filter(amenity => {
        const wheelchair = amenity.tags.wheelchair || 'unknown';
        const type = amenity.tags.amenity || 'unknown';
        const name = (amenity.tags.name || '').toLowerCase();
        
        if (wheelchairFilter !== 'all' && wheelchair !== wheelchairFilter) return false;
        if (typeFilter !== 'all' && type !== typeFilter) return false;
        if (searchFilter && !name.includes(searchFilter)) return false;
        
        return true;
    });
    
    displayAmenities(filteredAmenities);
}

function showLoadingState(loading) {
    const button = document.getElementById('load-amenities');
    if (loading) {
        button.textContent = 'Loading...';
        button.disabled = true;
    } else {
        button.textContent = '📊 Load Amenities';
        button.disabled = false;
    }
}

function showError(message) {
    alert(message);
}

function clearAmenityMarkers() {
    amenityMarkers.forEach(marker => map.removeLayer(marker));
    amenityMarkers = [];
}

function showReportModal() {
    const center = map.getCenter();
    document.getElementById('report-lat').value = center.lat;
    document.getElementById('report-lon').value = center.lng;
    document.getElementById('report-modal').style.display = 'block';
}

function hideReportModal() {
    document.getElementById('report-modal').style.display = 'none';
    document.getElementById('report-form').reset();
}

function submitReport(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const reportData = {
        lat: parseFloat(formData.get('lat')),
        lon: parseFloat(formData.get('lon')),
        issue_type: formData.get('issue_type'),
        description: formData.get('description')
    };
    
    fetch('/api/reports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Report submitted successfully!');
            hideReportModal();
            addReportMarker(reportData);
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        alert('Error submitting report');
        console.error('Error:', error);
    });
}

function loadExistingReports() {
    fetch('/api/reports')
        .then(response => response.json())
        .then(reports => {
            reports.forEach(report => {
                addReportMarker(report);
            });
        });
}

function addReportMarker(report) {
    const marker = L.marker([report.lat, report.lon], {
        icon: L.divIcon({
            className: 'report-marker',
            html: '⚠️',
            iconSize: [20, 20]
        })
    }).addTo(map);
    
    marker.bindPopup(`
        <strong>Accessibility Issue</strong><br>
        Type: ${report.issue_type}<br>
        ${report.description ? `Details: ${report.description}` : ''}
    `);
    
    reportMarkers.push(marker);
}

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') map.panBy([0, -100]);
    if (e.key === 'ArrowDown') map.panBy([0, 100]);
    if (e.key === 'ArrowLeft') map.panBy([-100, 0]);
    if (e.key === 'ArrowRight') map.panBy([100, 0]);
});

document.addEventListener('DOMContentLoaded', initMap);