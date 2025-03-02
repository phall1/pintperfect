import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { pubsAPI } from '@/services/api';
import { Pub } from '@/types';
import PubCard from '@/components/PubCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'top-rated'>('all');
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchPubs();
  }, []);

  const fetchPubs = async () => {
    setLoading(true);
    try {
      const response = await pubsAPI.getAllPubs();
      if (response.success && response.data) {
        setPubs(response.data);
      } else {
        setError(response.error || 'Failed to fetch pubs');
      }
    } catch (err) {
      setError('An error occurred while fetching pubs');
    } finally {
      setLoading(false);
    }
  };

  const filteredPubs = React.useMemo(() => {
    if (filter === 'top-rated') {
      return [...pubs].sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
    }
    return pubs;
  }, [pubs, filter]);

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'all' && { 
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
          },
        ]}
        onPress={() => setFilter('all')}
      >
        <ThemedText 
          style={[
            styles.filterText, 
            filter === 'all' && { color: 'white' }
          ]}
        >
          All Pubs
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'top-rated' && { 
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
          },
        ]}
        onPress={() => setFilter('top-rated')}
      >
        <ThemedText 
          style={[
            styles.filterText, 
            filter === 'top-rated' && { color: 'white' }
          ]}
        >
          Top Rated
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Temporary mock data for development
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

  if (loading && pubs.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (error && pubs.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPubs}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  // Use real data from the API, fallback to mock data if empty
  const displayPubs = filteredPubs.length > 0 ? filteredPubs : mockPubs;

  return (
    <ThemedView style={styles.container}>
      {renderFilters()}
      <FlatList
        data={displayPubs}
        renderItem={({ item }) => <PubCard pub={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchPubs}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>No pubs found</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0C6E4F',
  },
  filterText: {
    fontWeight: '500',
  },
});
