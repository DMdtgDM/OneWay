import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import AttachmentPanel from "../components/AttachmentPanel";
import {
  ChatColors,
  avatarColorFor,
  formatDayLabel,
  formatTime,
  initialFor,
} from "../constants/chat-theme";
import { auth } from "../firebase/config";
import { db } from "../firebase/firestore";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [failedMedia, setFailedMedia] = useState(() => new Set());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Track keyboard visibility so the input row's bottom padding (which
  // exists to clear the nav bar) can drop out while the keyboard is up —
  // the nav bar is covered by the keyboard then, so the extra space isn't
  // needed and was just showing up as a gap above the keyboard.
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const markMediaFailed = useCallback((url) => {
    setFailedMedia((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const theme = isDark ? ChatColors.dark : ChatColors.light;

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem("theme", JSON.stringify(newValue));
    } catch (_e) {
      // Non-fatal — theme just won't persist this time.
    }
  };

  // Load saved theme preference.
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
      } catch (_e) {
        // ignore
      }
    })();
  }, []);

  const getOrCreateUsername = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUsername(userSnap.data().username);
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newUsername = `User_${randomNum}`;

      await setDoc(userRef, {
        username: newUsername,
        createdAt: serverTimestamp(),
      });

      setUsername(newUsername);
    }
  };

  // Sign in (anonymously) and load/create a username.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await getOrCreateUsername(u.uid);
        setLoading(false);
      } else {
        signInAnonymously(auth).catch((e) =>
          console.error("Anonymous sign-in failed:", e)
        );
      }
    });

    return unsubscribe;
  }, []);

  // Live message subscription.
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(msgs);
      },
      (error) => console.error("Message subscription failed:", error)
    );

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user) return;

    setInput("");
    const quoted = replyingTo;
    setReplyingTo(null);
    try {
      await addDoc(collection(db, "messages"), {
        type: "text",
        text,
        userId: user.uid,
        username,
        createdAt: serverTimestamp(),
        replyTo: quoted ? buildReplySnapshot(quoted) : null,
      });
    } catch (e) {
      console.error("Failed to send message:", e);
      Alert.alert("Message not sent", "Check your connection and try again.");
      setInput(text);
      setReplyingTo(quoted);
    }
  };

  const sendEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
  };

  const sendGif = async (gifUrl) => {
    if (!user) return;
    setPanelOpen(false);
    const quoted = replyingTo;
    setReplyingTo(null);
    try {
      await addDoc(collection(db, "messages"), {
        type: "sticker",
        sticker: gifUrl,
        userId: user.uid,
        username,
        createdAt: serverTimestamp(),
        replyTo: quoted ? buildReplySnapshot(quoted) : null,
      });
    } catch (e) {
      console.error("Failed to send GIF:", e);
      Alert.alert("Couldn't send that GIF", "Please try again.");
    }
  };

  const buildReplySnapshot = (item) => ({
    id: item.id,
    username: item.username || "Anonymous",
    text: item.type === "text" ? item.text : null,
    sticker: item.type === "sticker" ? item.sticker : null,
  });

  const confirmDelete = useCallback(
    (item) => {
      if (!user || item.userId !== user.uid) return;
      Alert.alert("Delete message?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "messages", item.id));
            } catch (e) {
              console.error("Failed to delete message:", e);
              Alert.alert("Couldn't delete", "Please try again.");
            }
          },
        },
      ]);
    },
    [user]
  );

  const openMessageActions = useCallback(
    (item) => {
      const isMine = user && item.userId === user.uid;
      const buttons = [
        { text: "Reply", onPress: () => setReplyingTo(item) },
      ];
      if (isMine) {
        buttons.push({
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(item),
        });
      }
      buttons.push({ text: "Cancel", style: "cancel" });
      Alert.alert("Message", undefined, buttons);
    },
    [user, confirmDelete]
  );

  // Precompute which messages need a date separator above them.
  const dayBreaks = useMemo(() => {
    const breaks = new Set();
    messages.forEach((item, i) => {
      const date = item.createdAt?.toDate ? item.createdAt.toDate() : null;
      const nextDate =
        i + 1 < messages.length && messages[i + 1].createdAt?.toDate
          ? messages[i + 1].createdAt.toDate()
          : null;

      const label = formatDayLabel(date);
      const nextLabel = formatDayLabel(nextDate);

      if (i === messages.length - 1 || label !== nextLabel) {
        breaks.add(item.id);
      }
    });
    return breaks;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }) => {
      const isMine = user && item.userId === user.uid;
      const isSticker = item.type === "sticker" && item.sticker;
      const isText = item.type === "text" || (!item.type && item.text);
      const date = item.createdAt?.toDate ? item.createdAt.toDate() : null;

      return (
        <View>
          {dayBreaks.has(item.id) && (
            <View style={styles.dayBreak}>
              <Text style={[styles.dayBreakText, { color: theme.subtext }]}>
                {formatDayLabel(date) || "Sending…"}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.messageRow,
              isMine ? styles.messageRowMine : styles.messageRowTheirs,
            ]}
          >
            {!isMine && (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: avatarColorFor(item.username) },
                ]}
              >
                <Text style={styles.avatarText}>{initialFor(item.username)}</Text>
              </View>
            )}

            <View style={{ maxWidth: "78%" }}>
              {!isMine && (
                <Text style={[styles.username, { color: theme.subtext }]}>
                  {item.username || "Anonymous"}
                </Text>
              )}

              <Pressable
                onLongPress={() => openMessageActions(item)}
                delayLongPress={350}
              >
                {item.replyTo && (
                  <View
                    style={[
                      styles.replyQuote,
                      {
                        backgroundColor: theme.replyQuoteBg,
                        borderLeftColor: theme.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.replyQuoteName, { color: theme.accent }]}
                      numberOfLines={1}
                    >
                      {item.replyTo.username}
                    </Text>
                    <Text
                      style={[styles.replyQuoteText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.replyTo.text || (item.replyTo.sticker ? "GIF" : "")}
                    </Text>
                  </View>
                )}

                {isText && (
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMine
                          ? theme.bubbleMine
                          : theme.bubbleTheirs,
                        borderBottomRightRadius: isMine ? 4 : 18,
                        borderBottomLeftRadius: isMine ? 18 : 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isMine ? theme.bubbleTextMine : theme.bubbleTextTheirs,
                        fontSize: 15,
                        lineHeight: 21,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                )}

                {isSticker && (
                  failedMedia.has(item.sticker) ? (
                    <View
                      style={[
                        styles.stickerImage,
                        styles.mediaFallback,
                        { backgroundColor: theme.bubbleTheirs },
                      ]}
                    >
                      <Text style={[styles.mediaFallbackText, { color: theme.subtext }]}>
                        GIF unavailable
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.sticker }}
                      style={styles.stickerImage}
                      contentFit="cover"
                      autoplay
                      onError={() => markMediaFailed(item.sticker)}
                    />
                  )
                )}
              </Pressable>

              <Text
                style={[
                  styles.timestamp,
                  { color: theme.subtext, textAlign: isMine ? "right" : "left" },
                ]}
              >
                {formatTime(date)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [user, dayBreaks, theme, openMessageActions, failedMedia, markMediaFailed]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.connectingText, { color: theme.text }]}>
            Connecting…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.header, borderBottomColor: theme.headerBorder },
        ]}
      >
        <View style={styles.headerProfile}>
          <View
            style={[styles.headerAvatar, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="chatbubbles" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.name, { color: theme.text }]}>OneWay</Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
              {username ? `You're ${username}` : "Connecting…"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={16}
            color={theme.subtext}
            style={{ marginRight: 6 }}
          />
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#c7c9cc", true: theme.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.chatArea}
          keyboardShouldPersistTaps="handled"
        />

        {panelOpen && (
          <AttachmentPanel theme={theme} onPickEmoji={sendEmoji} onPickGif={sendGif} />
        )}

        {replyingTo && (
          <View
            style={[
              styles.replyBar,
              {
                backgroundColor: theme.header,
                borderTopColor: theme.headerBorder,
              },
            ]}
          >
            <View style={[styles.replyBarAccent, { backgroundColor: theme.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyBarName, { color: theme.accent }]} numberOfLines={1}>
                Replying to {replyingTo.username || "Anonymous"}
              </Text>
              <Text style={[styles.replyBarText, { color: theme.subtext }]} numberOfLines={1}>
                {replyingTo.type === "sticker" ? "GIF" : replyingTo.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
              <Ionicons name="close" size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.header,
              borderTopColor: theme.headerBorder,
              paddingBottom: keyboardVisible ? 10 : insets.bottom + 10,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setPanelOpen((p) => !p)}
            style={styles.iconButton}
          >
            <Ionicons
              name={panelOpen ? "close-circle" : "happy-outline"}
              size={24}
              color={theme.accent}
            />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.inputText,
                borderColor: theme.inputBorder,
              },
            ]}
            multiline
            onFocus={() => setPanelOpen(false)}
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              { backgroundColor: input.trim() ? theme.accent : theme.inputBorder },
            ]}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  connectingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },

  chatArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },

  dayBreak: {
    alignItems: "center",
    marginVertical: 10,
  },
  dayBreakText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowTheirs: {
    justifyContent: "flex-start",
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  username: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 4,
  },

  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
  },

  stickerImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },

  mediaFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  mediaFallbackText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  timestamp: {
    fontSize: 10,
    marginTop: 3,
    marginHorizontal: 4,
  },

  replyQuote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  replyQuoteName: {
    fontSize: 12,
    fontWeight: "700",
  },
  replyQuoteText: {
    fontSize: 12,
    opacity: 0.85,
  },

  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  replyBarAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
  },
  replyBarName: {
    fontSize: 12,
    fontWeight: "700",
  },
  replyBarText: {
    fontSize: 12,
    marginTop: 1,
  },
  replyBarClose: {
    padding: 4,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    padding: 6,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
