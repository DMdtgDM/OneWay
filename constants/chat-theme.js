// Palette and small helpers shared by the chat screen.

export const ChatColors = {
  light: {
    background: "#F0F2F5",
    header: "#FFFFFF",
    headerBorder: "#E2E5E9",
    text: "#1C1E21",
    subtext: "#65676B",
    bubbleMine: "#2F80ED",
    bubbleTheirs: "#FFFFFF",
    bubbleTextMine: "#FFFFFF",
    bubbleTextTheirs: "#1C1E21",
    inputBackground: "#FFFFFF",
    inputBorder: "#E2E5E9",
    inputText: "#1C1E21",
    placeholder: "#8A8D91",
    panelBackground: "#FFFFFF",
    divider: "#E2E5E9",
    accent: "#2F80ED",
    danger: "#E0245E",
    replyQuoteBg: "#EEF1F4",
  },
  dark: {
    background: "#0E0F10",
    header: "#17181A",
    headerBorder: "#2A2C2E",
    text: "#F2F3F5",
    subtext: "#9BA1A6",
    bubbleMine: "#2F80ED",
    bubbleTheirs: "#26282B",
    bubbleTextMine: "#FFFFFF",
    bubbleTextTheirs: "#F2F3F5",
    inputBackground: "#1D1F21",
    inputBorder: "#2A2C2E",
    inputText: "#F2F3F5",
    placeholder: "#767A7D",
    panelBackground: "#17181A",
    divider: "#2A2C2E",
    accent: "#5B9CF6",
    danger: "#FF6B8B",
    replyQuoteBg: "#20232A",
  },
};

// A small fixed palette so each username always maps to the same color.
const AVATAR_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#4ADE80",
  "#34D399", "#22D3EE", "#60A5FA", "#A78BFA",
  "#F472B6", "#F97316",
];

export function avatarColorFor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function initialFor(name = "") {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

export function formatTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(date) {
  if (!date) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export const EMOJIS = [
  // Faces & emotions
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😜", "🤩", "🥳",
  "😎", "🤔", "🙄", "😴", "😭", "😡", "🥺", "😇", "🤗", "🤭",
  "😅", "😉", "😌", "😋", "😝", "🤪", "😏", "😒", "😳", "🥰",
  "😢", "😤", "😱", "🥶", "🥵", "🤯", "😷", "🤒", "🤢", "🤮",
  "🥴", "😵", "🤠", "🥸", "😈", "👻", "💀", "👽", "🤖", "😺",

  // Gestures & people
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👌", "✌️", "🤞",
  "👋", "🤙", "👊", "✊", "🫶", "🤟", "🖐️", "👀", "🧠", "💃",

  // Hearts & symbols
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💯",
  "✨", "🔥", "💫", "⭐", "🌟", "💥", "❗", "❓", "✅", "🚫",

  // Celebration & activities
  "🎉", "🎊", "🎂", "🎁", "🎈", "🏆", "🎮", "🎧", "🎵", "📚",
  "⚽", "🏀", "🏈", "🎾", "🚴", "🏃", "💻", "📱", "⏰", "💡",

  // Food & drink
  "☕", "🍵", "🍕", "🍔", "🍟", "🌮", "🍎", "🍌", "🍉", "🍇",
  "🍩", "🍪", "🍫", "🍿", "🥤", "🍺", "🍷", "🥗", "🍜", "🍦",

  // Animals & nature
  "🐶", "🐱", "🦁", "🐸", "🦋", "🐝", "🐢", "🦄", "🐼", "🦊",
  "🌸", "🌻", "🌞", "🌙", "⚡", "🌈", "☀️", "☁️", "❄️", "🌊",

  // Travel & objects
  "🚗", "✈️", "🚀", "🏠", "🎓", "💼", "📷", "🎁", "🔑", "🕐",
];

export const GIFS = [
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
  "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
];
