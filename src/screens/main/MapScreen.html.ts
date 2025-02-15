export const mapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      body { 
        padding: 0; 
        margin: 0; 
      }
      #map { 
        height: 100vh; 
        width: 100%; 
      }
      .custom-pin {
        width: 30px;
        height: 30px;
      }
      .pin {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: #FF4B55;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%;
        top: 50%;
        margin: -20px 0 0 -20px;
        animation-name: bounce;
        animation-fill-mode: both;
        animation-duration: 1s;
      }
      .user-location {
        width: 20px;
        height: 20px;
      }
      .user-dot {
        width: 20px;
        height: 20px;
        background: #4285F4;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }
      .user-pulse {
        background: rgba(66, 133, 244, 0.4);
        border-radius: 50%;
        height: 40px;
        width: 40px;
        position: absolute;
        left: 50%;
        top: 50%;
        margin: -20px 0px 0px -20px;
        transform: rotateX(55deg);
        z-index: -2;
        animation: pulse 2s ease-out infinite;
      }
      .pulse {
        background: rgba(255, 75, 85, 0.4);
        border-radius: 50%;
        height: 14px;
        width: 14px;
        position: absolute;
        left: 50%;
        top: 50%;
        margin: 11px 0px 0px -12px;
        transform: rotateX(55deg);
        z-index: -2;
      }
      .pulse:after {
        content: "";
        border-radius: 50%;
        height: 40px;
        width: 40px;
        position: absolute;
        margin: -13px 0 0 -13px;
        animation: pulsate 1s ease-out infinite;
        opacity: 0;
        box-shadow: 0 0 1px 2px #FF4B55;
      }
      @keyframes pulse {
        0% { transform: scale(0.1); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
      }
      @keyframes pulsate {
        0% {transform: scale(0.1, 0.1); opacity: 0;}
        50% {opacity: 1;}
        100% {transform: scale(1.2, 1.2); opacity: 0;}
      }
      @keyframes bounce {
        0% {opacity: 0; transform: translateY(-2000px) rotate(-45deg);}
        60% {opacity: 1; transform: translateY(30px) rotate(-45deg);}
        80% {transform: translateY(-10px) rotate(-45deg);}
        100% {transform: translateY(0) rotate(-45deg);}
      }
      .leaflet-control-zoom {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) !important;
        margin-top: 0;
        margin-left: 0;
        border: none;
        background: transparent;
      }
      .leaflet-control-zoom a {
        background: #fff;
        width: 40px;
        height: 40px;
        line-height: 40px;
        margin: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border-radius: 8px;
        color: #FF4B55;
        font-size: 24px;
        transition: all 0.2s;
      }
      .leaflet-control-zoom a:hover {
        background: #FF4B55;
        color: white;
        transform: scale(1.1);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      if (!window.map) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Map not initialized yet'
        }));
        return;
      }

      try {
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([0, 0], 2);

        L.control.zoom().addTo(map);

        map.createPane('custom');
        map.getPane('custom').style.zIndex = 650;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var currentMarker = null;
        var userLocationMarker = null;

        map.on('click', function(e) {
          if (currentMarker) {
            map.removeLayer(currentMarker);
          }

          currentMarker = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'custom-pin',
              html: \`<div class="pin"></div>
                     <div class="pulse"></div>\`
            })
          }).on('mouseover', function() {
            this.openPopup();
          }).on('mouseout', function() {
            this.closePopup();
          }).addTo(map);

          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng)
            .then(response => response.json())
            .then(data => {
              const locationName = data.display_name || 'Unknown Location';
              currentMarker.bindPopup(locationName).openPopup();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location',
                name: locationName,
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                address: locationName,
                category: 'Manual Pin'
              }));
            })
            .catch(error => {
              console.error('Error:', error);
              currentMarker.bindPopup('Selected Location').openPopup();
            });
        });

        map.whenReady(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'mapReady' 
          }));
        });

        console.log('Map initialized');
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Map init failed: ' + error.message
        }));
      }
    </script>
  </body>
</html>
`;