import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Text,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Pub } from "@/types";

// Mock data for development
const MOCK_PUBS: Pub[] = [
  {
    id: "1",
    name: "The Guinness Pub",
    address: "123 Dublin St, Dublin",
    latitude: 53.349805,
    longitude: -6.26031,
    averageRating: 9.3,
  },
  {
    id: "2",
    name: "Irish Tavern",
    address: "456 Cork Rd, Cork",
    latitude: 51.896892,
    longitude: -8.486316,
    averageRating: 8.7,
  },
  {
    id: "3",
    name: "Emerald Isle Bar",
    address: "789 Galway Ave, Galway",
    latitude: 53.270668,
    longitude: -9.056791,
    averageRating: 7.5,
  },
];

// Default region (Dublin, Ireland)
const DEFAULT_REGION = {
  latitude: 53.349805,
  longitude: -6.26031,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const mapRef = useRef<MapView>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location.coords);
      } catch (error) {
        setErrorMsg("Could not get your location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePubSelect = (pub: Pub) => {
    setSelectedPub(pub);
    
    if (mapRef.current && pub.latitude && pub.longitude) {
      mapRef.current.animateToRegion({
        latitude: pub.latitude,
        longitude: pub.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleViewPub = (pubId: string) => {
    router.push(`/pub/${pubId}`);
  };

  const centerOnUserLocation = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
        <ThemedText style={styles.loadingText}>Finding pubs near you...</ThemedText>
      </ThemedView>
    );
  }

  if (errorMsg && !location) {
    return (
      <ThemedView style={styles.centered}>
        <IconSymbol
          name="exclamationmark.triangle"
          size={48}
          color={Colors[colorScheme ?? "light"].tabIconDefault}
        />
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      </ThemedView>
    );
  }

  const userRegion = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : DEFAULT_REGION;

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userRegion}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {MOCK_PUBS.map((pub) => (
          <Marker
            key={pub.id}
            coordinate={{
              latitude: pub.latitude,
              longitude: pub.longitude,
            }}
            title={pub.name}
            description={pub.averageRating ? `Rating: ${pub.averageRating.toFixed(1)}/10` : "No ratings yet"}
            pinColor={Colors[colorScheme ?? "light"].tint}
            onCalloutPress={() => handleViewPub(pub.id)}
            onPress={() => handlePubSelect(pub)}
          />
        ))}
      </MapView>

      {selectedPub && (
        <View style={styles.pubInfoContainer}>
          <View style={styles.pubInfo}>
            <ThemedText style={styles.pubName}>{selectedPub.name}</ThemedText>
            <ThemedText style={styles.pubAddress}>{selectedPub.address}</ThemedText>
            {selectedPub.averageRating && (
              <ThemedText style={styles.pubRating}>
                Rating: {selectedPub.averageRating.toFixed(1)}/10
              </ThemedText>
            )}
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => handleViewPub(selectedPub.id)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.locationButton,
          { backgroundColor: Colors[colorScheme ?? "light"].card },
        ]}
        onPress={centerOnUserLocation}
      >
        <IconSymbol
          name="location"
          size={24}
          color={Colors[colorScheme ?? "light"].tint}
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  pubInfoContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pubInfo: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pubName: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  pubAddress: {
    fontSize: 14,
    marginBottom: 6,
    color: "#555",
  },
  pubRating: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#B58D3D",
  },
  viewDetailsButton: {
    backgroundColor: "#0C6E4F",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  locationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});