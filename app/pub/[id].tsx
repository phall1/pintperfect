import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import RatingStars from '@/components/RatingStars';
import { pubsAPI, ratingsAPI } from '@/services/api';
import { Pub, Rating } from '@/types';

export default function PubDetailScreen() {
  const { id, ratingId } = useLocalSearchParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchPubDetails();
  }, [id]);

  const fetchPubDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, try to get the pub details
      const pubResponse = await pubsAPI.getPubById(id as string);
      if (pubResponse.success && pubResponse.data) {
        setPub(pubResponse.data);
        
        // If pub details succeeded, try to get ratings
        try {
          const ratingsResponse = await ratingsAPI.getRatingsByPubId(id as string);
          if (ratingsResponse.success && ratingsResponse.data) {
            setRatings(ratingsResponse.data);
          } else {
            console.warn('Ratings fetch failed:', ratingsResponse.error);
            // We don't set error here since we at least have the pub data
          }
        } catch (ratingsErr) {
          console.error('Error fetching ratings:', ratingsErr);
          // We don't set error here since we at least have the pub data
        }
      } else {
        setError(pubResponse.error || 'Failed to fetch pub details');
        console.error('Pub fetch failed:', pubResponse.error);
        if (!pubResponse.success && pubResponse.error?.includes('not found')) {
          Alert.alert('Pub Not Found', 'The pub you are looking for could not be found.');
        }
      }
    } catch (err) {
      console.error('Error in fetchPubDetails:', err);
      setError('An error occurred while fetching pub details. Please check your network connection and try again.');
      Alert.alert('Connection Error', 'Could not connect to the server. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatePub = () => {
    if (pub) {
      router.push(`/rate?pubId=${pub.id}`);
    }
  };

  const openMap = () => {
    if (displayPub) {
      let url;
      // Different map URLs for iOS and Android
      if (Platform.OS === 'ios') {
        // Apple Maps for iOS
        url = `https://maps.apple.com/?q=${encodeURIComponent(displayPub.name)}&ll=${displayPub.latitude},${displayPub.longitude}`;
      } else {
        // Google Maps for Android
        url = `https://www.google.com/maps/search/?api=1&query=${displayPub.latitude},${displayPub.longitude}&query_place_id=${encodeURIComponent(displayPub.name)}`;
      }
      
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Error',
            'Cannot open maps app. Make sure you have a maps app installed.',
            [{ text: 'OK' }]
          );
        }
      });
    }
  };

  const callPub = () => {
    if (displayPub && displayPub.phoneNumber) {
      const phoneUrl = `tel:${displayPub.phoneNumber}`;
      Linking.canOpenURL(phoneUrl).then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Cannot open phone app.');
        }
      });
    } else {
      Alert.alert('No Phone Number', 'This pub does not have a phone number listed.');
    }
  };

  const visitWebsite = () => {
    if (displayPub && displayPub.website) {
      // Make sure the website URL has http:// or https:// prefix
      let websiteUrl = displayPub.website;
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      Linking.canOpenURL(websiteUrl).then(supported => {
        if (supported) {
          Linking.openURL(websiteUrl);
        } else {
          Alert.alert('Error', 'Cannot open this website. The URL may be invalid.');
        }
      }).catch(() => {
        Alert.alert('Error', 'There was a problem opening the website.');
      });
    } else {
      Alert.alert('No Website', 'This pub does not have a website listed.');
    }
  };

  // Mock data for development
  const mockPub: Pub = {
    id: '1',
    name: 'The Guinness Pub',
    address: '123 Dublin St, Dublin',
    latitude: 53.349805,
    longitude: -6.26031,
    phoneNumber: '+353 1 234 5678',
    website: 'https://guinness.com',
    openingHours: 'Mon-Sun: 11am - 11pm',
    averageRating: 9.3,
  };

  const mockRatings: Rating[] = [
    {
      id: '1',
      userId: '123',
      pubId: '1',
      score: 9.5,
      comment: 'Perfect pint, creamy head and great temperature!',
      date: new Date('2023-05-10'),
      user: {
        id: '123',
        username: 'guinness_lover',
        email: 'user@example.com',
        createdAt: new Date('2023-01-15'),
      }
    },
    {
      id: '2',
      userId: '456',
      pubId: '1',
      score: 8.0,
      comment: 'Good pint but could use a colder glass.',
      date: new Date('2023-06-15'),
      user: {
        id: '456',
        username: 'pint_connoisseur',
        email: 'connoisseur@example.com',
        createdAt: new Date('2022-12-10'),
      }
    },
    {
      id: '3',
      userId: '789',
      pubId: '1',
      score: 10.0,
      comment: 'Best pint in all of Dublin!',
      date: new Date('2023-07-22'),
      user: {
        id: '789',
        username: 'irish_stout',
        email: 'stout@example.com',
        createdAt: new Date('2023-02-20'),
      }
    },
  ];

  // Use real data from API, fallback to mock data only if needed
  const displayPub = pub || (id ? null : mockPub);
  const displayRatings = ratings.length > 0 ? ratings : (id ? [] : mockRatings);

  // Compute average rating
  const averageRating = displayRatings.length > 0
    ? displayRatings.reduce((sum, r) => sum + r.score, 0) / displayRatings.length
    : displayPub.averageRating || 0;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Loading pub details...</ThemedText>
      </ThemedView>
    );
  }

  if (error && !pub) {
    return (
      <ThemedView style={styles.centered}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPubDetails}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: displayPub.photos?.[0]?.url || 'https://via.placeholder.com/400x200?text=Pub' }} 
          style={styles.headerImage} 
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="white" />
        </TouchableOpacity>
      </View>
      
      <ThemedView style={styles.pubInfoContainer}>
        <ThemedText style={styles.pubName}>{displayPub.name}</ThemedText>
        <ThemedText style={styles.pubAddress}>{displayPub.address}</ThemedText>
        
        <View style={styles.ratingContainer}>
          <RatingStars rating={averageRating} size={24} showValue={true} />
          <ThemedText style={styles.ratingCount}>
            ({displayRatings.length} {displayRatings.length === 1 ? 'rating' : 'ratings'})
          </ThemedText>
        </View>
      </ThemedView>
      
      <ThemedView style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={openMap}>
          <IconSymbol name="map" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.actionText}>Directions</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={callPub}>
          <IconSymbol name="phone" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.actionText}>Call</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={visitWebsite}>
          <IconSymbol name="globe" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.actionText}>Website</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleRatePub}>
          <IconSymbol name="star.fill" size={24} color={Colors[colorScheme ?? 'light'].rating} />
          <ThemedText style={styles.actionText}>Rate</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {displayPub.openingHours && (
        <ThemedView style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Opening Hours</ThemedText>
          <ThemedText style={styles.openingHours}>{displayPub.openingHours}</ThemedText>
        </ThemedView>
      )}
      
      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Pint Ratings</ThemedText>
          <TouchableOpacity style={styles.rateButton} onPress={handleRatePub}>
            <ThemedText style={styles.rateButtonText}>Rate a Pint</ThemedText>
          </TouchableOpacity>
        </View>
        
        {displayRatings.length === 0 ? (
          <ThemedText style={styles.noRatings}>No ratings yet. Be the first to rate!</ThemedText>
        ) : (
          displayRatings.map((rating) => {
            // Highlight the specific rating if ratingId is provided
            const isHighlighted = ratingId === rating.id;
            
            return (
              <ThemedView 
                key={rating.id} 
                style={[
                  styles.ratingItem, 
                  isHighlighted && { borderColor: Colors[colorScheme ?? 'light'].tint, borderWidth: 2 }
                ]}
              >
                <View style={styles.ratingHeader}>
                  <ThemedText style={styles.raterName}>{rating.user?.username || 'Anonymous'}</ThemedText>
                  <ThemedText style={styles.ratingDate}>
                    {new Date(rating.date).toLocaleDateString()}
                  </ThemedText>
                </View>
                
                <RatingStars rating={rating.score} showValue={true} />
                
                {rating.comment && (
                  <ThemedText style={styles.ratingComment}>"{rating.comment}"</ThemedText>
                )}
                
                {rating.photos && rating.photos.length > 0 && (
                  <ScrollView horizontal style={styles.photosScroll}>
                    {rating.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo.url }}
                        style={styles.ratingPhoto}
                      />
                    ))}
                  </ScrollView>
                )}
              </ThemedView>
            );
          })
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0C6E4F',
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pubInfoContainer: {
    padding: 16,
  },
  pubName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pubAddress: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCount: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
  },
  sectionContainer: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  openingHours: {
    fontSize: 16,
    lineHeight: 24,
  },
  rateButton: {
    backgroundColor: '#0C6E4F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rateButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  noRatings: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    opacity: 0.6,
  },
  ratingItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  raterName: {
    fontWeight: 'bold',
  },
  ratingDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  ratingComment: {
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  photosScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  ratingPhoto: {
    width: 120,
    height: 80,
    borderRadius: 4,
    marginRight: 8,
  },
});