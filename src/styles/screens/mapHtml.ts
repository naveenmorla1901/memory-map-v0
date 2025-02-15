export const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset=\"utf-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\" />
    <link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\" />
    <script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\"></script>
    <style>
        body {
            padding: 0;
            margin: 0;
        }
        
        html, body, #map {
            height: 100%;
            width: 100%;
        }
        
        .user-dot {
            background-color: #FF4B55;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        
        .leaflet-control-zoom {
            display: none;
        }

        .custom-popup .leaflet-popup-content-wrapper {
            background: #2c3e50;
            color: white;
            font-size: 12px;
            line-height: 16px;
            border-radius: 4px;
        }
        .custom-popup .leaflet-popup-tip {
            background: #2c3e50;
        }
    </style>
</head>
<body>
    <div id=\"map\"></div>
    <script>
        // Initialize map
        var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 2);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);
        
        // Variables to store markers
        var userMarker = null;
        var searchMarker = null;
        var popup = null;
        
        // Handle map clicks
        map.on('click', async function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            
            try {
                const response = await fetch(
                    \`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`
                );
                const data = await response.json();
                const address = data.display_name;

                // Remove existing marker and popup
                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }
                
                // Create new marker with popup
                searchMarker = L.marker([lat, lng]).addTo(map);
                searchMarker.bindPopup(
                    '<div style=\"max-width: 200px; font-size: 12px;\">' + address + '</div>',
                    { 
                        className: 'custom-popup',
                        closeButton: false,
                        offset: [0, -20]
                    }
                ).openPopup();
                
                // Send coordinates to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location',
                    latitude: lat,
                    longitude: lng,
                    address: address
                }));
            } catch (error) {
                console.error('Error getting address:', error);
            }
        });
        
        // Notify React Native that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
        }));
    </script>
</body>
</html>
`;