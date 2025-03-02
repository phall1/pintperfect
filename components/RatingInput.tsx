import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import RatingStars from "./RatingStars";
import { IconSymbol } from "./ui/IconSymbol";

interface RatingInputProps {
  initialRating?: number;
  onSubmit: (rating: number, comment: string, photos: string[]) => void;
}

export default function RatingInput({
  initialRating = 5,
  onSubmit,
}: RatingInputProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const colorScheme = useColorScheme();

  const handleSubmit = () => {
    onSubmit(rating, comment, photos);
  };

  const handleAddPhoto = () => {
    // This would typically use expo-image-picker
    // For now, we'll just add a placeholder
    setPhotos([
      ...photos,
      "https://via.placeholder.com/300x200?text=Pint+Photo",
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.ratingContainer}>
        <ThemedText style={styles.label}>Your Rating:</ThemedText>
        <RatingStars
          rating={rating}
          onRate={setRating}
          readOnly={false}
          size={30}
          showValue={true}
        />
      </View>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={rating}
        onValueChange={setRating}
        minimumTrackTintColor={Colors[colorScheme ?? "light"].tint}
        maximumTrackTintColor={Colors[colorScheme ?? "light"].border}
        thumbTintColor={Colors[colorScheme ?? "light"].rating}
      />

      <View style={styles.commentContainer}>
        <ThemedText style={styles.label}>Comments:</ThemedText>
        <TextInput
          style={[
            styles.commentInput,
            {
              color: Colors[colorScheme ?? "light"].text,
              backgroundColor: Colors[colorScheme ?? "light"].card,
              borderColor: Colors[colorScheme ?? "light"].border,
            },
          ]}
          placeholder="What did you think of this pint?"
          placeholderTextColor={Colors[colorScheme ?? "light"].tabIconDefault}
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <View style={styles.photoSection}>
        <ThemedText style={styles.label}>Add Photos:</ThemedText>
        <View style={styles.photoList}>
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photoThumbnail}
            />
          ))}
          <TouchableOpacity
            style={[
              styles.addPhotoButton,
              { backgroundColor: Colors[colorScheme ?? "light"].card },
            ]}
            onPress={handleAddPhoto}
          >
            <IconSymbol
              name="plus"
              size={24}
              color={Colors[colorScheme ?? "light"].tint}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
        onPress={handleSubmit}
      >
        <ThemedText style={styles.submitText}>Submit Rating</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    margin: 4,
    borderRadius: 8,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
