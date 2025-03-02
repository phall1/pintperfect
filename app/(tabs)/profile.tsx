import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { User, Rating } from '@/types';
import { authAPI, ratingsAPI } from '@/services/api';
import RatingStars from '@/components/RatingStars';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await authAPI.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          setIsLoggedIn(true);
          fetchUserRatings(response.data.id);
        } else {
          // Token might be expired
          await AsyncStorage.removeItem('auth_token');
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRatings = async (userId: string) => {
    try {
      const response = await ratingsAPI.getRatingsByUserId(userId);
      if (response.success && response.data) {
        setRatings(response.data);
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        const { user, token } = response.data;
        await AsyncStorage.setItem('auth_token', token);
        setUser(user);
        setIsLoggedIn(true);
        fetchUserRatings(user.id);
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Login Error', 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
      setIsLoggedIn(false);
      setRatings([]);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRating = (ratingId: string, pubId: string) => {
    router.push(`/pub/${pubId}?ratingId=${ratingId}`);
  };

  const handleDeleteRating = async (ratingId: string) => {
    Alert.alert(
      'Delete Rating',
      'Are you sure you want to delete this rating?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await ratingsAPI.deleteRating(ratingId);
              if (response.success) {
                // Remove the deleted rating from state
                setRatings(ratings.filter(rating => rating.id !== ratingId));
              } else {
                Alert.alert('Error', response.error || 'Failed to delete rating');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while deleting the rating');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Mock user data for development
  const mockUser: User = {
    id: '123',
    username: 'guinness_lover',
    email: 'user@example.com',
    createdAt: new Date('2023-01-15'),
  };

  // Mock ratings data
  const mockRatings: Rating[] = [
    {
      id: '1',
      userId: '123',
      pubId: '1',
      score: 9.5,
      comment: 'Perfect pint, creamy head and great temperature!',
      date: new Date('2023-05-10'),
      pub: {
        id: '1',
        name: 'The Guinness Pub',
        address: '123 Dublin St, Dublin',
        latitude: 53.349805,
        longitude: -6.26031,
      }
    },
    {
      id: '2',
      userId: '123',
      pubId: '2',
      score: 7.0,
      comment: 'Decent pint but could be colder.',
      date: new Date('2023-06-22'),
      pub: {
        id: '2',
        name: 'Irish Tavern',
        address: '456 Cork Rd, Cork',
        latitude: 51.896892,
        longitude: -8.486316,
      }
    },
  ];

  // Use mock data for development
  const displayUser = user || mockUser;
  const displayRatings = ratings.length > 0 ? ratings : mockRatings;

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loginContainer}>
          <ThemedText style={styles.loginTitle}>Login to Rate Pints</ThemedText>
          
          {/* Login form would go here in a real app */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => {
              // Mock login for development
              setUser(mockUser);
              setIsLoggedIn(true);
              setRatings(mockRatings);
            }}
          >
            <ThemedText style={styles.loginButtonText}>Login</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.registerButton}>
            <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: displayUser.profilePicture || 'https://via.placeholder.com/150?text=G' }} 
            style={styles.profileImage} 
          />
        </View>
        <ThemedText style={styles.username}>{displayUser.username}</ThemedText>
        <ThemedText style={styles.email}>{displayUser.email}</ThemedText>
        <ThemedText style={styles.memberSince}>
          Member since {new Date(displayUser.createdAt).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statItem}>
          <ThemedText style={styles.statValue}>{displayRatings.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Pints Rated</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText style={styles.statValue}>
            {displayRatings.length > 0 
              ? (displayRatings.reduce((sum, r) => sum + r.score, 0) / displayRatings.length).toFixed(1) 
              : '-'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Avg. Rating</ThemedText>
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.ratingsContainer}>
        <ThemedText style={styles.sectionTitle}>Your Ratings</ThemedText>
        
        {displayRatings.length === 0 ? (
          <ThemedText style={styles.noRatings}>You haven't rated any pints yet.</ThemedText>
        ) : (
          displayRatings.map(rating => (
            <ThemedView key={rating.id} style={styles.ratingItem}>
              <View style={styles.ratingHeader}>
                <ThemedText style={styles.pubName}>{rating.pub?.name}</ThemedText>
                <ThemedText style={styles.ratingDate}>
                  {new Date(rating.date).toLocaleDateString()}
                </ThemedText>
              </View>
              
              <RatingStars rating={rating.score} showValue={true} />
              
              {rating.comment && (
                <ThemedText style={styles.ratingComment}>"{rating.comment}"</ThemedText>
              )}
              
              <View style={styles.ratingActions}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleViewRating(rating.id, rating.pubId)}
                >
                  <IconSymbol name="eye" size={16} color={Colors[colorScheme ?? 'light'].text} />
                  <ThemedText style={styles.actionButtonText}>View</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteRating(rating.id)}
                >
                  <IconSymbol name="trash" size={16} color="#FF3B30" />
                  <ThemedText style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))
        )}
      </ThemedView>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
      </TouchableOpacity>
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
  },
  loginContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#0C6E4F',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#0C6E4F',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#0C6E4F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#0C6E4F',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F4EFE1',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0C6E4F',
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
  },
  ratingsContainer: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noRatings: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  ratingItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pubName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  ratingComment: {
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ratingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});