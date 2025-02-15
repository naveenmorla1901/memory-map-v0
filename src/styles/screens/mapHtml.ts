export const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
            background: white;
            color: #333;
            font-size: 14px;
            line-height: 18px;
            border-radius: 8px;
            padding: 0;
            overflow: hidden;
        }
        
        .custom-popup .leaflet-popup-tip {
            background: white;
        }

        .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
        }

        .popup-content {
            padding: 12px;
        }

        .popup-address {
            margin-bottom: 8px;
            color: #333;
        }

        .save-button {
            background-color: #FF4B55;
            color: white;
            text-align: center;
            padding: 8px;
            cursor: pointer;
            font-weight: bold;
            border-top: 1px solid #eee;
        }

        .save-button:hover {
            background-color: #E0434B;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map
        window.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 2);

        // Add OpenStreetMap tiles
        window.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(window.map);
        
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
                
                // Create popup content with save button
                const popupContent = \`
                    <div class="popup-content">
                        <div class="popup-address">\${address}</div>
                    </div>
                    <div class="save-button" onclick="handleSaveClick(\${lat}, \${lng}, '\${address.replace(/'/g, "\\'")}')">
                        Save Location
                    </div>
                \`;
                
                // Create new marker with popup
                searchMarker = L.marker([lat, lng]).addTo(map);
                searchMarker.bindPopup(
                    popupContent,
                    { 
                        className: 'custom-popup',
                        closeButton: false,
                        offset: [0, -20]
                    }
                ).openPopup();
                
                // Send coordinates to React Native (without triggering save)
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    latitude: lat,
                    longitude: lng,
                    address: address
                }));
            } catch (error) {
                console.error('Error getting address:', error);
            }
        });

        // Handle save button click
        window.handleSaveClick = function(lat, lng, address) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'saveLocation',
                latitude: lat,
                longitude: lng,
                address: address
            }));
        };
        
        // Notify React Native that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
        }));
    </script>
</body>
</html>
`;