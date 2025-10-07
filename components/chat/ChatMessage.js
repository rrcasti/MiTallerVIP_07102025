import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importamos el hook de navegación
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Video } from 'expo-video';
import { Check } from 'lucide-react-native';

export default function ChatMessage({ message, isMine }) {
    const navigation = useNavigation(); // Usamos el hook para obtener el objeto de navegación
    const videoRef = React.useRef(null);
    const [isVideoLoading, setIsVideoLoading] = React.useState(true);

    const formattedTime = message.timestamp
        ? format(message.timestamp, 'HH:mm', { locale: es })
        : '--:--';

    // Función para manejar el toque sobre la imagen o video
    const handleFilePress = () => {
        if (message.type === 'image' || message.type === 'video') {
            navigation.navigate('FileViewer', { fileUrl: message.fileUrl, fileType: message.type });
        }
    };

    const renderMessageContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    // El componente TouchableOpacity hace que la imagen sea pulsable
                    <TouchableOpacity onPress={handleFilePress}>
                        <Image source={{ uri: message.fileUrl }} style={styles.image} resizeMode="cover" />
                    </TouchableOpacity>
                );
            case 'video':
                return (
                    // El video también se envuelve en TouchableOpacity
                    <TouchableOpacity onPress={handleFilePress}>
                        <View style={styles.videoContainer}>
                            <Video
                                ref={videoRef}
                                style={styles.video}
                                source={{ uri: message.fileUrl }}
                                useNativeControls={false} // Desactivamos los controles para que el toque funcione
                                resizeMode="cover"
                                onLoadStart={() => setIsVideoLoading(true)}
                                onLoad={() => setIsVideoLoading(false)}
                            />
                            {isVideoLoading && <ActivityIndicator style={styles.videoOverlay} size="large" color="#FFFFFF"/>}
                        </View>
                    </TouchableOpacity>
                );
            case 'text':
            default:
                return <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>{message.text}</Text>;
        }
    };

    return (
        <View style={[styles.messageContainer, isMine ? styles.myMessageContainer : styles.otherMessageContainer]}>
            <View style={[styles.messageBubble, isMine ? styles.myMessageBubble : styles.otherMessageBubble]}>
                {renderMessageContent()}
                <View style={styles.footer}>
                    <Text style={isMine ? styles.myTimestamp : styles.otherTimestamp}>{formattedTime}</Text>
                    {isMine && (
                        <View style={styles.statusContainer}>
                            <Check size={12} color={message.read ? '#4CAF50' : '#A0AEC0'} />
                            {message.read && <Check size={12} color="#4CAF50" />}
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
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    videoOverlay: {
        position: 'absolute',
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