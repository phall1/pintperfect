import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "./ThemedText";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  readOnly?: boolean;
}

export default function RatingStars({
  rating,
  maxRating = 10,
  size = 20,
  onRate,
  showValue = false,
  readOnly = true,
}: RatingStarsProps) {
  const colorScheme = useColorScheme();
  const ratingColor = Colors[colorScheme ?? "light"].rating;

  const handlePress = (index: number) => {
    if (!readOnly && onRate) {
      onRate(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(index)}
            disabled={readOnly}
            style={styles.starButton}
          >
            <IconSymbol
              size={size}
              name={index < Math.floor(rating) ? "star.fill" : "star"}
              color={ratingColor}
            />
          </TouchableOpacity>
        ))}
      </View>

      {showValue && (
        <ThemedText style={styles.ratingText}>
          {rating.toFixed(1)}/10
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
  },
  starButton: {
    marginHorizontal: 2,
  },
  ratingText: {
    marginLeft: 10,
    fontWeight: "bold",
  },
});
