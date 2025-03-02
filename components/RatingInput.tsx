import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
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

  const [isUploading, setIsUploading] = useState(false);

  const handleAddPhoto = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to add images to your rating.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsUploading(true);
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          // Format base64 image for API
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          setPhotos([...photos, base64Image]);
        } else {
          Alert.alert('Error', 'Could not process the selected image.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
            <View key={index} style={styles.photoContainer}>
              <Image
                source={{ uri: photo }}
                style={styles.photoThumbnail}
              />
              <TouchableOpacity 
                style={styles.removePhotoButton}
                onPress={() => {
                  const newPhotos = [...photos];
                  newPhotos.splice(index, 1);
                  setPhotos(newPhotos);
                }}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={22}
                  color="#FF3B30"
                />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity
            style={[
              styles.addPhotoButton,
              { backgroundColor: Colors[colorScheme ?? "light"].card },
            ]}
            onPress={handleAddPhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={Colors[colorScheme ?? "light"].tint} />
            ) : (
              <IconSymbol
                name="plus"
                size={24}
                color={Colors[colorScheme ?? "light"].tint}
              />
            )}
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.photoHint}>
          {photos.length === 0 ? "Add photos of your pint" : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} added`}
        </ThemedText>
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
  photoContainer: {
    position: "relative",
    margin: 4,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
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
  photoHint: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
    opacity: 0.7,
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
