import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Pub } from "@/types";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import RatingStars from "./RatingStars";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface PubCardProps {
  pub: Pub;
  distance?: number;
}

export default function PubCard({ pub, distance }: PubCardProps) {
  const colorScheme = useColorScheme();
  const placeholderImage = "https://via.placeholder.com/150x100?text=Pub";

  const handlePress = () => {
    router.push(`/pub/${pub.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <ThemedView style={styles.card}>
        <Image
          source={{ uri: pub.photos?.[0]?.url || placeholderImage }}
          style={styles.image}
        />
        <View style={styles.content}>
          <ThemedText style={styles.name}>{pub.name}</ThemedText>
          <ThemedText style={styles.address}>{pub.address}</ThemedText>

          <View style={styles.ratingContainer}>
            {pub.averageRating ? (
              <RatingStars
                rating={pub.averageRating}
                size={14}
                showValue={true}
              />
            ) : (
              <ThemedText style={styles.noRating}>No ratings yet</ThemedText>
            )}
          </View>

          {distance !== undefined && (
            <ThemedText style={styles.distance}>
              {distance < 1
                ? `${Math.round(distance * 1000)}m away`
                : `${distance.toFixed(1)}km away`}
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noRating: {
    fontStyle: "italic",
    fontSize: 12,
    opacity: 0.6,
  },
  distance: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
});
