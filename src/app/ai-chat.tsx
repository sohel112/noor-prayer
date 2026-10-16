// Deen — AI Islamic Chatbot (AiDeen)
// Powered by Gemini API. 10 free messages per user per day.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, useTheme } from '../components/ui';
import { FONTS } from '../lib/theme';
import {
  sendChatMessage, getRemainingMessages, hasApiKeys,
  type ChatMessage,
} from '../lib/gemini';

const SUGGESTIONS = [
  'What are the 5 pillars of Islam?',
  'How to pray Fajr step by step?',
  'What breaks my fast in Ramadan?',
  'Dua for anxiety and stress?',
];

export default function AiChat() {
  const th = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(10);
  const [configured, setConfigured] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    setConfigured(hasApiKeys());
    getRemainingMessages().then(setRemaining);
    // Welcome message
    setMessages([{
      role: 'assistant',
      text: 'Assalamu Alaikum! 🤲\n\nI\'m AiDeen, your Islamic assistant. Ask me about prayer, fasting, Quran, duas, or daily life guidance.\n\nI answer based on Quran and authentic Hadith.',
    }]);
  }, []);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    if (!configured) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'AI service is being set up. Please try again in a moment! 🔧',
      }]);
      return;
    }

    setInput('');
    setSending(true);
    const userMsg: ChatMessage = { role: 'user', text: msg };
    const history = [...messages, userMsg];
    setMessages(history);

    try {
      const { reply, remaining: newRemaining } = await sendChatMessage(messages, msg);
      setMessages([...history, { role: 'assistant', text: reply }]);
      setRemaining(newRemaining);
    } catch (e: any) {
      setMessages([...history, {
        role: 'assistant',
        text: `Sorry, ${e.message || 'something went wrong'}. Please try again!`,
      }]);
    } finally {
      setSending(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, sending, messages, configured]);

  const renderMsg = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: th.primary }]
          : [styles.aiBubble, { backgroundColor: th.card, borderColor: th.border }],
      ]}>
        <Text style={[
          styles.msgText,
          { color: isUser ? '#FFF' : th.text },
        ]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <Screen edges={['top']}>
      <TopBar
        title="🤖 AiDeen"
        onBack={() => router.back()}
        right={
          <View style={[styles.limitBadge, { backgroundColor: th.accentSoft }]}>
            <Text style={[styles.limitText, { color: th.accent }]}>
              {remaining}/10 left
            </Text>
          </View>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMsg}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        {messages.length <= 1 && (
          <View style={styles.suggestions}>
            <Text style={[styles.suggestTitle, { color: th.sub }]}>Try asking:</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => send(s)}
                style={[styles.suggestChip, { borderColor: th.border, backgroundColor: th.card }]}
              >
                <Text style={[styles.suggestText, { color: th.primary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.inputBar, { borderTopColor: th.border, backgroundColor: th.card }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about Islam..."
            placeholderTextColor={th.sub}
            multiline
            style={[styles.input, { color: th.text, borderColor: th.border }]}
            editable={!sending && remaining > 0}
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={sending || !input.trim() || remaining <= 0}
            style={[
              styles.sendBtn,
              { backgroundColor: th.primary, opacity: (sending || !input.trim() || remaining <= 0) ? 0.4 : 1 },
            ]}
          >
            {sending
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.sendText}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  msgText: { fontSize: 15, lineHeight: 22, fontFamily: FONTS.body },
  limitBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  limitText: { fontSize: 12, fontWeight: '700' },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  suggestTitle: { fontSize: 13, marginBottom: 4 },
  suggestChip: {
    borderWidth: 1, borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start',
  },
  suggestText: { fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sendText: { color: '#FFF', fontSize: 20 },
});
