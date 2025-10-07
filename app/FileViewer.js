// RUTA: app/FileViewer.js
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { Video } from 'expo-video';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function FileViewerScreen() {
    const { fileUrl, fileType } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            {fileType === 'image' ? (
                <Image source={{ uri: fileUrl }} style={styles.media} resizeMode="contain" />
            ) : (
                <Video source={{ uri: fileUrl }} style={styles.media} useNativeControls resizeMode="contain" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    media: {
        width: '100%',
        height: '100%',
    },
});