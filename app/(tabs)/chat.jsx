// RUTA: app/(tabs)/chat.tsx (o chat.jsx)

import React, { useEffect, useState } from 'react';
// --- CAMBIO ESTÉTICO: Se añaden los componentes para el layout y el teclado ---
import { 
    View, 
    FlatList, 
    StyleSheet, 
    SafeAreaView, 
    KeyboardAvoidingView, 
    Platform, 
    ImageBackground 
} from 'react-native';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessage from '../../components/chat/ChatMessage';
import EmptyChat from '../../components/chat/EmptyChat';
import { auth } from '../../firebase/config';
import { findOrCreateConversation, listenToMessages, sendMessage } from '../../services/chatService';

// --- NO SE TOCA NINGUNA FUNCIÓN NI LÓGICA ---
export default function ChatScreen() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    findOrCreateConversation(userId)
      .then(conv => {
        setConversation(conv);
        setLoadingConversation(false);
        const unsubscribe = listenToMessages(conv.id, setMessages);
        return unsubscribe;
      })
      .then(unsubscribe => {
        return () => unsubscribe && unsubscribe();
      })
      .catch(error => {
        console.error('Error cargando conversación:', error);
        setLoadingConversation(false);
      });
  }, []);

  const handleSendMessage = async (messageData) => {
    if (!conversation) return;
    await sendMessage(conversation.id, messageData);
  };

  const renderItem = ({ item }) => {
    const isMine = item.uid === auth.currentUser.uid;
    return <ChatMessage message={item} isMine={isMine} />;
  };

  // --- SOLO SE MODIFICA LA ESTRUCTURA VISUAL (JSX) ---
  return (
    <SafeAreaView style={styles.container}>
      {/* --- CAMBIO ESTÉTICO: Se añade un fondo con patrón --- */}
      <ImageBackground 
        source={require('../../assets/chat-background.png')} // Asegúrate de tener esta imagen en tus assets
        style={styles.backgroundImage}
      >
        {/* --- CAMBIO ESTÉTICO: Se añade el KeyboardAvoidingView para el comportamiento del teclado --- */}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          //keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 60} // Puedes ajustar este valor
        >
          <ChatHeader activeRepairsCount={0} />
          
          <View style={styles.messagesContainer}>
            {messages.length === 0 && !loadingConversation ? (
              <EmptyChat />
            ) : (
              <FlatList
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                inverted // Mantiene los mensajes nuevos abajo
                // --- CAMBIO ESTÉTICO: Se ajusta el estilo para que la lista crezca desde abajo ---
                contentContainerStyle={styles.listContentContainer}
              />
            )}
          </View>
          
          <ChatInput onSendMessage={handleSendMessage} />
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// --- SOLO SE AÑADEN ESTILOS PARA LOS NUEVOS COMPONENTES VISUALES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  backgroundImage: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  messagesContainer: { 
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    flexGrow: 1, // Permite que el contenido crezca
    justifyContent: 'flex-end', // Alinea los mensajes en la parte inferior
  },
});