// RUTA: components/chat/ChatMessage.jsx

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, PlayCircle } from 'lucide-react-native';

export default function ChatMessage({ message, isMine, onVideoPress, onImagePress }) { // ✅ CAMBIO 1: Agregado onImagePress
    const formattedTime = message.timestamp
        ? format(message.timestamp, 'HH:mm', { locale: es })
        : '--:--';

    const handleFilePress = () => {
        const fileUrl = message.fileUrl || message.imageUrl || message.videoUrl;
        const fileType = message.type;

        console.log('[ChatMessage] handleFilePress()');
        console.log(`[ChatMessage] Tipo: ${fileType}`);
        console.log(`[ChatMessage] URL: ${fileUrl}`);

        // ✅ CAMBIO 2: Usar modal para imágenes también
        if (fileType === 'image' && onImagePress) {
            onImagePress(fileUrl);
        } else if (fileType === 'video' && onVideoPress) {
            onVideoPress(fileUrl);
        }
    };

    const renderMessageContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <TouchableOpacity onPress={handleFilePress} activeOpacity={0.8}>
                        <Image 
                            source={{ uri: message.fileUrl || message.imageUrl }} 
                            style={styles.image} 
                            resizeMode="cover" 
                        />
                    </TouchableOpacity>
                );

            case 'video':
                return (
                    <TouchableOpacity onPress={handleFilePress} activeOpacity={0.8}>
                        <View style={styles.videoContainer}>
                            <Image 
                                source={{ uri: message.fileUrl || message.videoUrl }} 
                                style={styles.videoThumbnail} 
                                resizeMode="cover" 
                            />
                            <View style={styles.videoOverlay}>
                                <View style={styles.playButton}>
                                    <PlayCircle size={64} color="#FFFFFF" fill="rgba(0,0,0,0.6)" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );

            case 'text':
            default:
                return (
                    <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>
                        {message.text}
                    </Text>
                );
        }
    };

    const isMessageRead = message.isRead || message.read || message.isReaded;

    return (
        <View style={[styles.messageContainer, isMine ? styles.myMessageContainer : styles.otherMessageContainer]}>
            <View style={[styles.messageBubble, isMine ? styles.myMessageBubble : styles.otherMessageBubble]}>
                {renderMessageContent()}
                <View style={styles.footer}>
                    <Text style={isMine ? styles.myTimestamp : styles.otherTimestamp}>
                        {formattedTime}
                    </Text>
                    {isMine && (
                        <View style={styles.statusContainer}>
                            <Check size={12} color={isMessageRead ? '#4CAF50' : '#A0AEC0'} />
                            {isMessageRead && <Check size={12} color="#4CAF50" />}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageContainer: { marginVertical: 4, maxWidth: '80%' },
    myMessageContainer: { alignSelf: 'flex-end' },
    otherMessageContainer: { alignSelf: 'flex-start' },

    messageBubble: { padding: 10, borderRadius: 20, maxWidth: '100%' },

    myMessageBubble: {
        backgroundColor: '#DCF8C6',
        borderBottomRightRadius: 5,
        borderBottomLeftRadius: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    otherMessageBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },

    myMessageText: {
        color: '#000000',
        fontSize: 16,
        lineHeight: 22,
    },
    otherMessageText: {
        color: '#000000',
        fontSize: 16,
        lineHeight: 22,
    },

    myTimestamp: {
        color: '#5B5B5B',
        fontSize: 10,
    },
    otherTimestamp: {
        color: '#5B5B5B',
        fontSize: 10,
    },

    image: {
        width: 200,
        height: 200,
        borderRadius: 15,
        marginTop: 4,
    },
    videoContainer: {
        width: 200,
        height: 200,
        borderRadius: 15,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        overflow: 'hidden',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    videoOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    playButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
        marginTop: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});