import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 16,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#FF4B55',
  },
  mapControls: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    zIndex: 1,
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addressPreview: {
    position: 'absolute',
    top: '30%',
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addressPreviewText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  tapToSaveText: {
    fontSize: 14,
    color: '#FF4B55',
    fontStyle: 'italic',
  },
  locationInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  favoriteLabel: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF4B55',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});