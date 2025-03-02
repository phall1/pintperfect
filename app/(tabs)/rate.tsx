import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import RatingInput from '@/components/RatingInput';
import { pubsAPI, ratingsAPI } from '@/services/api';
import { Pub } from '@/types';

export default function RateScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const [nearbyPubs, setNearbyPubs] = useState<Pub[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  // If pubId is passed in params, load that pub
  useEffect(() => {
    if (params.pubId) {
      fetchPubDetails(params.pubId as string);
    } else {
      fetchNearbyPubs();
    }
  }, [params.pubId]);

  const fetchPubDetails = async (pubId: string) => {
    setLoading(true);
    try {
      const response = await pubsAPI.getPubById(pubId);
      if (response.success && response.data) {
        setSelectedPub(response.data);
      }
    } catch (error) {
      console.error('Error fetching pub details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPubs = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const response = await pubsAPI.getNearbyPubs(
        location.coords.latitude,
        location.coords.longitude,
        2 // 2km radius
      );
      
      if (response.success && response.data) {
        setNearbyPubs(response.data);
      }
    } catch (error) {
      setLocationError('Could not get your location or nearby pubs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (rating: number, comment: string, photos: string[]) => {
    if (!selectedPub) {
      Alert.alert('Error', 'Please select a pub first');
      return;
    }

    setLoading(true);
    try {
      const response = await ratingsAPI.addRating(selectedPub.id, rating, comment);
      
      if (response.success) {
        Alert.alert(
          'Rating Submitted',
          `Thank you for rating ${selectedPub.name}!`,
          [
            {
              text: 'View Pub',
              onPress: () => router.push(`/pub/${selectedPub.id}`),
            },
            {
              text: 'Rate Another',
              onPress: () => {
                setSelectedPub(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit rating');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while submitting your rating');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockPubs: Pub[] = [
    {
      id: '1',
      name: 'The Guinness Pub',
      address: '123 Dublin St, Dublin',
      latitude: 53.349805,
      longitude: -6.26031,
      averageRating: 9.3,
    },
    {
      id: '2',
      name: 'Irish Tavern',
      address: '456 Cork Rd, Cork',
      latitude: 51.896892,
      longitude: -8.486316,
      averageRating: 8.7,
    },
    {
      id: '3',
      name: 'Emerald Isle Bar',
      address: '789 Galway Ave, Galway',
      latitude: 53.270668,
      longitude: -9.056791,
      averageRating: 7.5,
    },
  ];

  // Use mock data for development
  const displayPubs = mockPubs.length > 0 ? mockPubs : nearbyPubs;
  const mockSelectedPub = params.pubId 
    ? mockPubs.find(pub => pub.id === params.pubId) 
    : null;
  
  const pubToDisplay = selectedPub || mockSelectedPub;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        {pubToDisplay ? (
          <>
            <ThemedView style={styles.pubInfoContainer}>
              <ThemedText style={styles.pubName}>{pubToDisplay.name}</ThemedText>
              <ThemedText style={styles.pubAddress}>{pubToDisplay.address}</ThemedText>
            </ThemedView>
            
            <RatingInput 
              onSubmit={handleSubmitRating}
            />
            
            <TouchableOpacity
              style={styles.differentPubButton}
              onPress={() => setSelectedPub(null)}
            >
              <ThemedText style={styles.differentPubText}>Rate a different pub</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText style={styles.selectPubTitle}>Select a pub to rate:</ThemedText>
            
            {locationError && (
              <ThemedText style={styles.errorText}>{locationError}</ThemedText>
            )}
            
            {displayPubs.map((pub) => (
              <TouchableOpacity
                key={pub.id}
                style={styles.pubOption}
                onPress={() => setSelectedPub(pub)}
              >
                <ThemedText style={styles.pubOptionName}>{pub.name}</ThemedText>
                <ThemedText style={styles.pubOptionAddress}>{pub.address}</ThemedText>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => router.push('/map')}
            >
              <ThemedText style={styles.mapButtonText}>Find more pubs on map</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  pubInfoContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#0C6E4F',
  },
  pubName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  pubAddress: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  differentPubButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0C6E4F',
    alignItems: 'center',
  },
  differentPubText: {
    color: '#0C6E4F',
    fontWeight: '500',
  },
  selectPubTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  pubOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pubOptionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pubOptionAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  mapButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#0C6E4F',
    alignItems: 'center',
  },
  mapButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});