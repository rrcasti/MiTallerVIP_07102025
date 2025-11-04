// RUTA: app/(tabs)/chat.tsx

import React, { useEffect, useState, useRef } from 'react'; // ✅ CAMBIO 1: Agregado useRef
import { 
    View, 
    FlatList, 
    StyleSheet, 
    SafeAreaView, 
    KeyboardAvoidingView, 
    Platform, 
    ImageBackground 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native'; 
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessage from '../../components/chat/ChatMessage';
import EmptyChat from '../../components/chat/EmptyChat';
import VideoModal from '../../components/chat/VideoModal';
import ImageModal from '../../components/chat/ImageModal';
import { auth } from '../../firebase/config';
import { 
    findOrCreateConversation, 
    listenToMessages, 
    sendMessage,
    markConversationAsReadByClient
} from '../../services/chatService';

export default function ChatScreen() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef(null); // ✅ CAMBIO 2: Crear ref para FlatList
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    let unsubscribe = null;

    findOrCreateConversation(userId)
      .then(conv => {
        setConversation(conv);
        setLoadingConversation(false);
        unsubscribe = listenToMessages(conv.id, setMessages);
      })
      .catch(error => {
        console.error('Error cargando conversación:', error);
        setLoadingConversation(false);
      });

    return () => {
      if (unsubscribe) {
        console.log("[ChatScreen]: Desuscribiendo de mensajes...");
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (isFocused && conversation && messages.length > 0 && auth.currentUser) {
      console.log("[ChatScreen]: Pantalla en foco. Marcando mensajes como leídos...");
      markConversationAsReadByClient(conversation.id, messages, auth.currentUser.uid);
    }
  }, [isFocused, messages, conversation]);

  // ✅ CAMBIO 3: Scroll automático cuando llega un mensaje nuevo
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Pequeño delay para asegurar que el mensaje se haya renderizado
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]); // Solo cuando cambia la cantidad de mensajes

  const handleSendMessage = async (messageData) => {
    if (!conversation) return;
    await sendMessage(conversation.id, messageData);
    // El scroll automático se activará por el useEffect de arriba
  };

  const handleVideoPress = (videoUrl) => {
    console.log('[ChatScreen] Abriendo video en modal:', videoUrl);
    setSelectedVideo(videoUrl);
  };

  const handleImagePress = (imageUrl) => {
    console.log('[ChatScreen] Abriendo imagen en modal:', imageUrl);
    setSelectedImage(imageUrl);
  };

  const renderItem = ({ item }) => {
    const isMine = item.uid === auth.currentUser.uid;
    return (
      <ChatMessage 
        message={item} 
        isMine={isMine} 
        onVideoPress={handleVideoPress}
        onImagePress={handleImagePress}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require('../../assets/chat-background.png')}
        style={styles.backgroundImage}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ChatHeader activeRepairsCount={0} />
          
          <View style={styles.messagesContainer}>
            {messages.length === 0 && !loadingConversation ? (
              <EmptyChat />
            ) : (
              <FlatList
                ref__={flatListRef} // ✅ CAMBIO 4: Conectar la ref
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                inverted
                contentContainerStyle={styles.listContentContainer}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                }}
              />
            )}
          </View>
          
          <ChatInput onSendMessage={handleSendMessage} />
        </KeyboardAvoidingView>
      </ImageBackground>

      <VideoModal
        visible={!!selectedVideo}
        videoUrl={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <ImageModal
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A' 
  },
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
    paddingVertical: 10,
  },
});