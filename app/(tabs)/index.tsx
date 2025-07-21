import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db } from '../../lib/firebase';
import { usePhotoStore } from '../../lib/PhotoContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Example pins for testing
const hardcodedPins = [
  {
    photoUri: require('../../assets/images/exPins/cat.png'),
    caption: 'my catttt',
    latitude: '33.7765',
    longitude: '-84.3981',
    locationName: 'Tech Square, Atlanta',
    username: 'Alice',
  },
  {
    photoUri: require('../../assets/images/exPins/devilsElbow.png'),
    caption: 'Chill Sunday',
    latitude: '34.4435',
    longitude: '-84.2096',
    locationName: "Devil's Elbow, Dawsonville",
    username: 'Alice',
  },
  {
    photoUri: require('../../assets/images/exPins/bunBoHue.png'),
    caption: 'This bun bo hue is fireeee check out this place',
    latitude: '33.9572',
    longitude: '-84.1363',
    locationName: '3640 Satellite Blvd',
    username: 'Alice',
  },
  {
    photoUri: require('../../assets/images/exPins/blackcatpt1.png'),
    caption: 'he up',
    latitude: '33.7557',
    longitude: '-84.3911',
    locationName: 'Underground Atlanta',
    username: 'Alice',
  },
  {
    photoUri: require('../../assets/images/exPins/blackcatpt2.png'),
    caption: 'he down',
    latitude: '33.7557',
    longitude: '-84.3911',
    locationName: 'Underground Atlanta',
    username: 'Alice',
  },
];

export default function MapScreen() {
  const { photos } = usePhotoStore();


  const mapRef = useRef<MapView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);

  // Keeps track of liked photo IDs locally
  const [likedPhotos, setLikedPhotos] = useState<{ [id: string]: boolean }>({});

  const toggleLike = (photoId: string) => {
    setLikedPhotos((prev) => ({
      ...prev,
      [photoId]: !prev[photoId],
    }));
  };

  const router = useRouter();
  const params = useLocalSearchParams();
  const isPickerMode = params?.mode === 'picker';

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [firebasePhotos, setFirebasePhotos] = useState<any[]>([]);

  const allPhotos = [...photos, ...hardcodedPins, ...firebasePhotos];
  useFocusEffect(
  useCallback(() => {
    const fetchPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'photos'));

        const photosData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let photoUrl = data.imageUrl;
            return {
              id: doc.id,
              ...data,
              photoUri: photoUrl,
            };
          })
        );

        setFirebasePhotos(photosData);
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      }
    };

    fetchPhotos();
    fetchLocation();

    // Optional cleanup if needed
    return () => {
      setSuggestions([]);
    };
  }, [])
);





  // Search state
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Fetch autocomplete suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    if (!input.trim() || !currentLocation) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000&types=establishment&key=AIzaSyCOJiQgW_qtcP44NPZTDEtKIft5Lab3tIU`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK') {
        setSuggestions(json.predictions);
      } else {
        console.warn('Autocomplete error:', json.status, json.error_message);
        setSuggestions([]);
      }
    } catch (e) {
      console.error('Autocomplete fetch error:', e);
      setSuggestions([]);
    }
  };

  // Debounce user input to limit API calls
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchText.length > 0) {
        fetchSuggestions(searchText);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  // Fetch nearby places based on keyword
  const fetchNearby = async (keyword: string) => {
    if (!currentLocation) return;

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${currentLocation.latitude},${currentLocation.longitude}&rankby=distance&name=${encodeURIComponent(
      keyword
    )}&key=AIzaSyCOJiQgW_qtcP44NPZTDEtKIft5Lab3tIU`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log('Nearby search results:', json);
      setSuggestions(json.results || []);
    } catch (e) {
      console.error('Nearby search error:', e);
    }
  };

  // Center the map to user's current location
  const centerToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  // Request user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Animate to current location when it's available
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      centerToCurrentLocation();
    }
  }, [currentLocation]);

  // Group pins by rounded lat/lon for clustering
  const groupedByLocation = allPhotos.reduce((acc: any, photo: any) => {
    const lat = parseFloat(photo.latitude);
    const lon = parseFloat(photo.longitude);
    const key = `${Math.round(lat * 1000) / 1000},${Math.round(lon * 1000) / 1000}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  const firstPhoto = photos[0];
  const region = {
    latitude: firstPhoto ? parseFloat(firstPhoto.latitude) : 33.7756,
    longitude: firstPhoto ? parseFloat(firstPhoto.longitude) : -84.3963,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar + Suggestions */}
      <View style={styles.searchWrapper}>
        <TextInput
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            fetchSuggestions(text);
          }}
          onSubmitEditing={() => fetchNearby(searchText)}
          placeholder="Search places"
          style={styles.searchInput}
        />

        {/* Suggestion Dropdown */}
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => item.place_id || index.toString()}
            style={styles.suggestionList}
            renderItem={({ item }) => {
              const isAutocomplete = !!item.description;
              const displayText = isAutocomplete
                ? item.description
                : `${item.name}${item.vicinity ? ` - ${item.vicinity}` : ''}`;

              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={async () => {
                    const placeId = item.place_id;
                    const res = await fetch(
                      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyCOJiQgW_qtcP44NPZTDEtKIft5Lab3tIU`
                    );
                    const details = await res.json();
                    const { lat, lng } = details.result.geometry.location;

                    setSearchText(displayText);
                    setSuggestions([]);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      },
                      500
                    );
                  }}
                >
                  <Text>{displayText}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* MAP VIEW */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={true}
        onPress={(e) => {
          Keyboard.dismiss();
          if (isPickerMode) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            router.push({
              pathname: '/camera',
              params: { lat: latitude.toString(), lng: longitude.toString() },
            });
          }
        }}
      >
        {/* Render all grouped markers */}
        {Object.entries(groupedByLocation).map(([key, group], index) => {
          const [lat, lon] = key.split(',').map(Number);
          return (
            <Marker key={index} coordinate={{ latitude: lat, longitude: lon }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedPhotos(group);
                  setModalVisible(true);
                  mapRef.current?.animateToRegion(
                    {
                      latitude: lat,
                      longitude: lon,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    500
                  );
                }}
              >
                <View style={styles.markerWrapper}>
                  <Image
                    source={
                      typeof group[0].photoUri === 'string'
                        ? { uri: group[0].photoUri }
                        : group[0].photoUri
                    }
                    style={styles.markerImage}
                  />
                  {group.length > 1 && (
                    <View style={styles.photoCountBadge}>
                      <Text style={styles.photoCountText}>{group.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Marker>
          );
        })}
      </MapView>

      {/* Center to current location button */}
      <TouchableOpacity style={styles.locationButton} onPress={centerToCurrentLocation}>
        <Ionicons name="navigate" size={24} color="white" />
      </TouchableOpacity>

      {/* This is for expanding pin on the map to show full image, caption, and location */}
      <Modal
  visible={modalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <LinearGradient
      colors={['#0D47A1', '#1976D2']}
      style={styles.modalContent}
    >
      {/* ScrollView with images */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ alignSelf: 'center' }}
      >
        {selectedPhotos.map((photo, index) => (
          <View
            key={index}
            style={{
              width: SCREEN_WIDTH * 0.9,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: SCREEN_WIDTH * 0.9, alignItems: 'center' }}>
  <View style={styles.modalItem}>

    {/* Photo */}
    <Image
      source={typeof photo.photoUri === 'string' ? { uri: photo.photoUri } : photo.photoUri}
      style={styles.modalImage}
      resizeMode="cover"
    />

    {/* Caption */}
    {photo.caption ? (
      <Text style={styles.modalCaptionBottom}>{photo.caption}</Text>
    ) : null}
    {/* Heart Like Button */}
    <TouchableOpacity
      style={{ marginTop: 8, alignItems: 'center' }}
      onPress={() => toggleLike(photo.id || `${index}`)}
    >
      <Ionicons
        name={likedPhotos[photo.id || `${index}`] ? 'heart' : 'heart-outline'}
        size={28}
        color={likedPhotos[photo.id || `${index}`] ? '#FF3B30' : 'white'}
      />
    </TouchableOpacity>
  </View>

  {/* ABSOLUTE Username and Profile Picture in top-left */}
  <View style={styles.modalTopLeftUser}>
  {photo.profilePicture ? (
    <Image source={{ uri: photo.profilePicture }} style={styles.profilePic} />
  ) : (
    <Ionicons name="person-circle-outline" size={36} color="white" />
  )}
  <View>
    <Text style={styles.usernameText}>{photo.username || 'Unknown user'}</Text>
    {photo.locationName ? (
      <Text style={styles.modalLocationTop}>{photo.locationName}</Text>
    ) : null}
  </View>
</View>

</View>



          </View>
        ))}
      </ScrollView>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.modalCloseButtonBottom}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.modalCloseButtonText}>Close</Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
</Modal>

    </ThemedView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  searchWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  searchInput: {
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
  },
  suggestionList: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  markerWrapper: {
    position: 'relative',
  },
  markerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  photoCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaption: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalLocation: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#eee',
    borderRadius: 20,
    padding: 5,
  },
  modalContent: {
  width: SCREEN_WIDTH * 0.9,
  height: SCREEN_WIDTH * 1.6,
  backgroundColor: 'white',
  borderRadius: 15,
  paddingVertical: 20,
  alignItems: 'center',
  justifyContent: 'center',
},


  modalItem: {
    padding: 20,
    paddingBottom: 40,
    width: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    borderRadius: 20,
  },

  modalLocationTop: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    color: 'white',
  },

  modalImage: {
  width: SCREEN_WIDTH * 0.8,
  height: SCREEN_WIDTH * 1.2,
  borderRadius: 12,
  marginBottom: 10,
  resizeMode: 'cover',
},


  modalCaptionBottom: {
    fontSize: 14,
    textAlign: 'center',
    color: 'white',
    marginTop: 4,
  },

  modalCloseButtonBottom: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },

  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
modalUsernameTop: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 4,
  textAlign: 'center',
  color: 'white',
},
userHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

profilePic: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 10,
  borderWidth: 1,
  borderColor: 'white',
},

usernameText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
modalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
modalTopLeftUser: {
  position: 'absolute',
  top: 20,
  left: 20,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.4)',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 20,
  zIndex: 999,
},

});
