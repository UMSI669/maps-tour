import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PLACES, ROUTE, TOUR_BOUNDARY } from './src/data/places';
import { getCurrentCoordinates } from './src/services/locationService';

// ======================================================
// PART 1 — SHOW A MAP
//
// WHY: A map gives location-based information a useful visual context.
// PRODUCT QUESTION: What should a visitor see before choosing a place?
// DO: Change `map` from false to true in the lesson switches below.
// VERIFY: The gray preview becomes a pan-and-zoom map centered on the city.
// NEXT: Search for "PART 2 — RENDER PLACES" below.
// ======================================================
// Turn on one switch at a time. Each feature's complete implementation is ready below.
const LESSONS = {
  map: true,
  markers: true,
  selection: true,
  mapTap: true,
  overlays: true,
  camera: true,
  location: true,
  search: true,
};

const INITIAL_REGION = {
  latitude: 42.28,
  longitude: -83.74,
  latitudeDelta: 0.05,
  longitudeDelta: 0.065,
};

export default function App() {
  const mapRef = React.useRef<MapView>(null);
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<string | null>(null);
  const [mapPin, setMapPin] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = React.useState('');
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [cameraMessage, setCameraMessage] = React.useState('');

  const selectedPlace = PLACES.find(place => place.id === selectedPlaceId) ?? null;
  const visiblePlaces = PLACES.filter(place =>
    `${place.name} ${place.category} ${place.address}`.toLowerCase().includes(searchText.trim().toLowerCase()),
  );

  function focusPlace(place: (typeof PLACES)[number]) {
    setSelectedPlaceId(place.id);
    if (LESSONS.camera) {
      mapRef.current?.animateToRegion({
        latitude: place.coordinate.latitude,
        longitude: place.coordinate.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 450);
      setCameraMessage(`Focused on ${place.name}`);
    }
  }

  function fitAllPlaces() {
    mapRef.current?.fitToCoordinates(PLACES.map(place => place.coordinate), {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
    setCameraMessage(`Showing all ${PLACES.length} places`);
  }

  async function showMyLocation() {
    setLocationLoading(true);
    setLocationMessage('');
    try {
      const result = await getCurrentCoordinates();
      if (result.status === 'denied') {
        setLocationMessage('Location permission was not granted. You can still explore the map.');
        return;
      }
      setLocation(result.coordinate);
      setLocationMessage('Your current location is ready.');
      mapRef.current?.animateToRegion({
        ...result.coordinate,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 450);
    } catch {
      setLocationMessage('We could not read your location. Try again when location services are available.');
    } finally {
      setLocationLoading(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>EXPO + REACT NATIVE</Text>
          <Text style={styles.title}>City Explorer</Text>
          <Text style={styles.subtitle}>
            Explore a few favorite spots in Ann Arbor. Turn on each map feature as you work through the tour.
          </Text>

          {LESSONS.search ? (
            <TextInput
              accessibilityLabel="Search places"
              onChangeText={setSearchText}
              placeholder="Search places, categories, or addresses"
              returnKeyType="search"
              style={styles.searchInput}
              value={searchText}
            />
          ) : null}

          <View style={styles.mapFrame}>
            {LESSONS.map && Platform.OS !== 'web' ? (
              <MapView
                ref={LESSONS.camera ? mapRef : undefined}
                initialRegion={INITIAL_REGION}
                onPress={LESSONS.mapTap ? event => {
                  setMapPin(event.nativeEvent.coordinate);
                  setSelectedPlaceId(null);
                } : undefined}
                showsUserLocation={LESSONS.location && location !== null}
                style={styles.map}
                testID="city-map"
              >
                {LESSONS.markers ? visiblePlaces.map(place => (
                  <Marker
                    coordinate={place.coordinate}
                    key={place.id}
                    onPress={() => LESSONS.selection && setSelectedPlaceId(place.id)}
                    accessibilityLabel={place.name}
                    pinColor={selectedPlaceId === place.id ? '#e85c45' : '#315e56'}
                    testID={`place-marker-${place.id}`}
                    title={place.name}
                    description={place.category}
                  />
                )) : null}
                {LESSONS.mapTap && mapPin ? (
                  <Marker coordinate={mapPin} pinColor="#e85c45" testID="dropped-pin" title="Dropped pin" />
                ) : null}
                {LESSONS.overlays ? (
                  <>
                    <Polyline coordinates={ROUTE} strokeColor="#e85c45" strokeWidth={5} testID="city-route" />
                    <Polygon
                      coordinates={TOUR_BOUNDARY}
                      fillColor="rgba(49, 94, 86, 0.16)"
                      strokeColor="#315e56"
                      strokeWidth={2}
                      testID="tour-boundary"
                    />
                  </>
                ) : null}
              </MapView>
            ) : (
              <View accessibilityLabel="Map preview" style={styles.mapPlaceholder}>
                <View style={styles.mapGrid} />
                <View style={styles.previewPin}><Text style={styles.previewPinText}>AA</Text></View>
                <Text style={styles.previewTitle}>Ann Arbor, Michigan</Text>
                <Text style={styles.previewCaption}>Enable Part 1 to explore the interactive map.</Text>
              </View>
            )}
          </View>

          {LESSONS.camera ? (
            <View style={styles.controlRow}>
              <Pressable accessibilityRole="button" onPress={fitAllPlaces} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Fit all places</Text>
              </Pressable>
              {LESSONS.location ? (
                <Pressable accessibilityRole="button" disabled={locationLoading} onPress={showMyLocation} style={styles.primaryButton}>
                  {locationLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>My location</Text>}
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {cameraMessage ? <Text accessibilityLiveRegion="polite" style={styles.status}>{cameraMessage}</Text> : null}
          {locationMessage ? <Text accessibilityLiveRegion="polite" style={styles.status}>{locationMessage}</Text> : null}
          {location ? (
            <Text style={styles.coordinates}>
              Current position: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          ) : null}

          {LESSONS.selection && selectedPlace ? (
            <View accessibilityLabel="Selected place" style={styles.selectedCard} testID="selected-place-card">
              <View style={styles.selectedCardCopy}>
                <Text style={styles.cardEyebrow}>SELECTED PLACE · {selectedPlace.category.toUpperCase()}</Text>
                <Text style={styles.selectedTitle}>{selectedPlace.name}</Text>
                <Text style={styles.cardCopy}>{selectedPlace.address}</Text>
                <Text style={styles.cardCopy}>{selectedPlace.description}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setSelectedPlaceId(null)}>
                <Text style={styles.dismissText}>Close</Text>
              </Pressable>
            </View>
          ) : null}

          {LESSONS.mapTap && mapPin ? (
            <Text accessibilityLiveRegion="polite" style={styles.status} testID="dropped-pin-coordinate">
              Dropped pin: {mapPin.latitude.toFixed(4)}, {mapPin.longitude.toFixed(4)}
            </Text>
          ) : null}

          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionEyebrow}>A FEW LOCAL FAVORITES</Text>
              <Text style={styles.sectionTitle}>Places to explore</Text>
            </View>
            <Text style={styles.placeCount}>
              {visiblePlaces.length} {visiblePlaces.length === 1 ? 'place' : 'places'}
            </Text>
          </View>

          {visiblePlaces.length > 0 ? visiblePlaces.map(place => (
            <Pressable
              accessibilityRole={LESSONS.search ? 'button' : undefined}
              accessibilityState={LESSONS.selection ? { selected: selectedPlaceId === place.id } : undefined}
              disabled={!LESSONS.search && !LESSONS.selection}
              key={place.id}
              onPress={() => focusPlace(place)}
              style={[styles.placeCard, LESSONS.selection && selectedPlaceId === place.id ? styles.placeCardSelected : null]}
              testID={`place-card-${place.id}`}
            >
              <View style={styles.placeIcon}><Text style={styles.placeIconText}>{place.category.slice(0, 1)}</Text></View>
              <View style={styles.placeCopy}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.cardCopy}>{place.category} · {place.address}</Text>
              </View>
              {LESSONS.search ? <Text style={styles.arrow}>›</Text> : null}
            </Pressable>
          )) : (
            <Text style={styles.emptyState}>No places match “{searchText}”. Try another search.</Text>
          )}

          <View style={styles.tourNote}>
            <Text style={styles.tourNoteTitle}>Follow the code tour</Text>
            <Text style={styles.tourNoteCopy}>
              Search App.tsx for PART 1 through PART 8. Each part explains why the feature matters, what to enable, and how to verify it.
            </Text>
          </View>
          {Platform.OS === 'web' ? (
            <Text style={styles.webNote}>The native map lessons are designed for iOS and Android in Expo Go.</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ======================================================
// PART 2 — RENDER PLACES
//
// WHY: Data-driven markers keep the map and place catalog in sync.
// PRODUCT QUESTION: Which places deserve a pin, and how many is too many?
// DO: Change `markers` from false to true in the lesson switches above.
// VERIFY: One marker appears for each visible place.
// NEXT: Search for "PART 3 — SELECT A PLACE" below.
// ======================================================

// ======================================================
// PART 3 — SELECT A PLACE
//
// WHY: A marker should connect a coordinate to useful place information.
// PRODUCT QUESTION: What should appear before someone opens directions?
// DO: Change `selection` from false to true in the lesson switches above.
// VERIFY: Tap a marker or place card; details appear and the marker is highlighted.
// NEXT: Search for "PART 4 — RESPOND TO MAP TAPS" below.
// ======================================================

// ======================================================
// PART 4 — RESPOND TO MAP TAPS
//
// WHY: A map tap can capture a coordinate that isn't already in your dataset.
// PRODUCT QUESTION: Should a tap select a place or drop a temporary pin?
// DO: Change `mapTap` from false to true in the lesson switches above.
// VERIFY: Tap an empty map area and read the temporary pin's coordinates.
// NEXT: Search for "PART 5 — DRAW MAP OVERLAYS" below.
// ======================================================

// ======================================================
// PART 5 — DRAW MAP OVERLAYS
//
// WHY: Lines and filled shapes can explain routes and areas at a glance.
// PRODUCT QUESTION: Does the route or destination boundary need more emphasis?
// DO: Change `overlays` from false to true in the lesson switches above.
// VERIFY: A route line and a shaded tour boundary appear on the map.
// NEXT: Search for "PART 6 — CONTROL THE CAMERA" below.
// ======================================================

// ======================================================
// PART 6 — CONTROL THE CAMERA
//
// WHY: A map should help people reach relevant places without searching manually.
// PRODUCT QUESTION: When should the app move the map for someone?
// DO: Change `camera` from false to true in the lesson switches above.
// VERIFY: Tap Fit all places; the map zooms out to include every destination.
// NEXT: Search for "PART 7 — SHOW DEVICE LOCATION" below.
// ======================================================

// ======================================================
// PART 7 — SHOW DEVICE LOCATION
//
// WHY: Location can orient someone, but it requires permission and a useful fallback.
// PRODUCT QUESTION: Can the app remain useful when location access is denied?
// DO: Change `location` from false to true in the lesson switches above.
// VERIFY: Tap My location, grant foreground access, and see your position on the map.
// NEXT: Search for "PART 8 — SEARCH AND FOCUS PLACES" below.
// ======================================================

// ======================================================
// PART 8 — SEARCH AND FOCUS PLACES
//
// WHY: Search connects a large collection of places to a manageable map view.
// PRODUCT QUESTION: Should results match names, categories, or addresses?
// DO: Change `search` from false to true above. Parts 3 and 6 should already be on
//     so choosing a result can show details and move the camera.
// VERIFY: Search for “arboretum”, then tap a result and watch the map focus on it.
// NEXT: Run `npm run check-progress` and `npm test` to review the completed tour.
// ======================================================

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f6f7f4', flex: 1 },
  content: { gap: 14, padding: 18, paddingBottom: 36, paddingTop: 12 },
  eyebrow: { color: '#52746b', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#192b28', fontSize: 31, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#61716d', fontSize: 14, lineHeight: 21, marginTop: -7 },
  searchInput: { backgroundColor: '#fff', borderColor: '#dde4df', borderRadius: 12, borderWidth: 1, color: '#192b28', minHeight: 48, paddingHorizontal: 14 },
  mapFrame: { backgroundColor: '#e9eeea', borderRadius: 18, height: 330, overflow: 'hidden' },
  map: { flex: 1 },
  mapPlaceholder: { alignItems: 'center', backgroundColor: '#e6ece7', flex: 1, justifyContent: 'center', overflow: 'hidden' },
  mapGrid: { ...StyleSheet.absoluteFill, backgroundColor: '#e6ece7', borderColor: '#d6e0d8', borderLeftWidth: 1, borderRightWidth: 1, borderStyle: 'dashed', transform: [{ rotate: '12deg' }], width: '80%' },
  previewPin: { alignItems: 'center', backgroundColor: '#315e56', borderColor: '#fff', borderRadius: 22, borderWidth: 3, height: 48, justifyContent: 'center', marginBottom: 12, shadowColor: '#20332e', shadowOpacity: 0.2, shadowRadius: 6, width: 48 },
  previewPinText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  previewTitle: { color: '#20332e', fontSize: 17, fontWeight: '700' },
  previewCaption: { color: '#61716d', fontSize: 12, marginTop: 5 },
  controlRow: { flexDirection: 'row', gap: 9 },
  primaryButton: { alignItems: 'center', backgroundColor: '#315e56', borderRadius: 11, justifyContent: 'center', minHeight: 44, minWidth: 110, paddingHorizontal: 14 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#cad7d0', borderRadius: 11, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  secondaryButtonText: { color: '#315e56', fontSize: 13, fontWeight: '700' },
  status: { color: '#315e56', fontSize: 13, lineHeight: 19 },
  coordinates: { color: '#61716d', fontSize: 12 },
  selectedCard: { alignItems: 'flex-start', backgroundColor: '#fff', borderColor: '#cad7d0', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'space-between', padding: 14 },
  selectedCardCopy: { flex: 1, gap: 5 },
  cardEyebrow: { color: '#52746b', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  selectedTitle: { color: '#192b28', fontSize: 17, fontWeight: '800' },
  cardCopy: { color: '#697873', fontSize: 12, lineHeight: 17 },
  dismissText: { color: '#52746b', fontSize: 12, fontWeight: '700', padding: 4 },
  sectionHeadingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  sectionEyebrow: { color: '#80908a', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: '#192b28', fontSize: 20, fontWeight: '800', marginTop: 2 },
  placeCount: { color: '#80908a', fontSize: 11, paddingBottom: 3 },
  placeCard: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#edf0ed', borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 70, padding: 11 },
  placeCardSelected: { borderColor: '#52746b', borderWidth: 2 },
  placeIcon: { alignItems: 'center', backgroundColor: '#edf3ef', borderRadius: 11, height: 42, justifyContent: 'center', width: 42 },
  placeIconText: { color: '#315e56', fontSize: 17, fontWeight: '800' },
  placeCopy: { flex: 1, gap: 3 },
  placeName: { color: '#263a35', fontSize: 14, fontWeight: '700' },
  arrow: { color: '#52746b', fontSize: 25, lineHeight: 28, paddingHorizontal: 4 },
  emptyState: { backgroundColor: '#fff', borderRadius: 12, color: '#697873', fontSize: 13, lineHeight: 19, padding: 14 },
  tourNote: { backgroundColor: '#eaf0eb', borderRadius: 13, gap: 4, marginTop: 4, padding: 14 },
  tourNoteTitle: { color: '#315e56', fontSize: 13, fontWeight: '800' },
  tourNoteCopy: { color: '#61716d', fontSize: 12, lineHeight: 18 },
  webNote: { color: '#80908a', fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
