// … tus importaciones …
import SafeVideoPlayer from '../components/video/SafeVideoPlayer';

// … dentro de FileViewerScreen …

const renderContent = () => {
  if (fileType === 'image' && fileUrl) {
    return (
      <Image
        source={{ uri: fileUrl }}
        style={styles.media}
        resizeMode="contain"
      />
    );
  }

  if (fileType === 'video' && fileUrl) {
    return <SafeVideoPlayer uri={fileUrl} />;
  }

  return <Text style={styles.errorText}>Tipo de archivo no soportado.</Text>;
};
