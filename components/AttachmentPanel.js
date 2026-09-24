import { Image } from "expo-image";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EMOJIS, GIFS } from "../constants/chat-theme";

const PANEL_HEIGHT = 220;

export default function AttachmentPanel({ theme, onPickEmoji, onPickGif }) {
  const [tab, setTab] = useState("emoji");
  const [failedGifs, setFailedGifs] = useState(() => new Set());

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.panelBackground, borderColor: theme.divider },
      ]}
    >
      <View style={[styles.tabs, { borderBottomColor: theme.divider }]}>
        <Pressable
          onPress={() => setTab("emoji")}
          style={[styles.tab, tab === "emoji" && { borderBottomColor: theme.accent }]}
        >
          <Text style={[styles.tabLabel, { color: tab === "emoji" ? theme.accent : theme.subtext }]}>
            Emoji
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("gif")}
          style={[styles.tab, tab === "gif" && { borderBottomColor: theme.accent }]}
        >
          <Text style={[styles.tabLabel, { color: tab === "gif" ? theme.accent : theme.subtext }]}>
            GIFs
          </Text>
        </Pressable>
      </View>

      {tab === "emoji" ? (
        <FlatList
          key="emoji-grid"
          data={EMOJIS}
          keyExtractor={(item, i) => `${item}-${i}`}
          numColumns={8}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <Pressable
              style={styles.emojiCell}
              onPress={() => onPickEmoji(item)}
              hitSlop={4}
            >
              <Text style={styles.emojiText}>{item}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          key="gif-grid"
          data={GIFS}
          keyExtractor={(item) => item}
          numColumns={3}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPickGif(item)}
              style={styles.gifCell}
              disabled={failedGifs.has(item)}
            >
              {failedGifs.has(item) ? (
                <View style={[styles.gifImage, styles.gifFallback, { backgroundColor: theme.divider }]}>
                  <Ionicons name="image-outline" size={20} color={theme.subtext} />
                </View>
              ) : (
                <Image
                  source={{ uri: item }}
                  style={styles.gifImage}
                  contentFit="cover"
                  autoplay
                  onError={() =>
                    setFailedGifs((prev) => new Set(prev).add(item))
                  }
                />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PANEL_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    padding: 8,
  },
  emojiCell: {
    width: `${100 / 8}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 22,
  },
  gifCell: {
    width: `${100 / 3}%`,
    aspectRatio: 1,
    padding: 4,
  },
  gifImage: {
    flex: 1,
    borderRadius: 10,
  },
  gifFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
