import React, { useEffect, useRef } from 'react';
import { 
	View, 
	Text, 
	TouchableOpacity, 
	StyleSheet, 
	Animated, 
	Platform, 
	Image, 
	Vibration 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, X, FileText, Sparkles, MessageCircle } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

const InAppNotificationBanner = ({ isVisible, notification, onDismiss }) => {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	// Animaciones
	const translateY = useRef(new Animated.Value(-200)).current;
	const scale = useRef(new Animated.Value(1)).current;
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const targetY = insets.top + 30; // ✅ Respeta el notch y status bar

		if (isVisible && notification) {
			console.log('🎨 Banner visible, iniciando animaciones...');

			Vibration.vibrate([0, 100, 50, 100]);

			Animated.parallel([
				Animated.spring(translateY, {
					toValue: targetY,
					tension: 50,
					friction: 8,
					useNativeDriver: true,
				}),
				Animated.spring(scale, {
					toValue: 1.05,
					tension: 50,
					friction: 8,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();

			const pulseAnimation = Animated.loop(
				Animated.sequence([
					Animated.timing(scale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
					Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
				])
			);
			pulseAnimation.start();

			const stopTimeout = setTimeout(() => {
				pulseAnimation.stop();
			}, 5000);

			return () => clearTimeout(stopTimeout);
		} else {
			console.log('🎨 Banner ocultándose...');
			Animated.parallel([
				Animated.timing(translateY, {
					toValue: -200,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [isVisible, notification, insets.top]);

	if (!notification) {
		console.log('⚠️ Banner: No hay notificación para mostrar');
		return null;
	}

	const { title, body, data, id: notificationId } = notification;
	const { type, priority, fileUrl, imageUrl, actionUrl, relatedId } = data || {};

	// ✅ Corrección segura de URL
	const displayImageUrl = (() => {
		const url = imageUrl || fileUrl;
		if (!url) return null;
		if (url.includes('mitallervip.appspot.com')) {
			const corrected = url.replace('mitallervip.appspot.com', 'mitallervip.firebasestorage.app');
			console.log('✅ URL corregida para Image Component (404 FIX):', corrected);
			return corrected;
		}
		return url;
	})();

	const hasImage = !!displayImageUrl;

	const getIcon = () => {
		switch (type) {
			case 'promotion':
				return <Sparkles size={24} color="#FBBF24" />;
			case 'budget_approval':
			case 'invoice_approval':
				return <FileText size={24} color="#3B82F6" />;
			case 'service_update':
			case 'vehicle_ready':
				return <Bell size={24} color="#10B981" />;
			case 'new_message':
				return <MessageCircle size={24} color="#8B5CF6" />;
			default:
				return <Bell size={24} color="#FFFFFF" />;
		}
	};

	const getBannerColor = () => {
		if (priority === 'critical' || priority === 'high') return 'rgba(239, 68, 68, 0.95)';
		if (type === 'promotion') return 'rgba(251, 191, 36, 0.95)';
		return 'rgba(15, 23, 42, 0.95)';
	};

	const handleTap = () => {
		console.log('🎯 Banner Tocado! Tipo:', type, 'Data:', data);

		try {
			if (actionUrl) router.push(`/${actionUrl}`);
			else if (type === 'promotion') router.push('/documents');
			else if (type === 'budget_approval' || type === 'invoice_approval')
				router.push(`/documents/approval?documentId=${relatedId}`);
			else router.push('/(tabs)/notifications');
		} catch (error) {
			console.error('❌ Error al navegar desde banner:', error);
		}

		onDismiss();

		if (notificationId) {
			Notifications.dismissNotificationAsync(notificationId).catch(err => {
				console.error('⚠️ Error descartando notificación:', err);
			});
		}
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					transform: [{ translateY }, { scale: isVisible ? scale : 1 }],
					opacity,
				},
			]}
			pointerEvents={isVisible ? 'auto' : 'none'} // ✅ Evita bloqueos táctiles invisibles
		>
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={handleTap}
				style={[styles.banner, { backgroundColor: getBannerColor() }]}
			>
				{(priority === 'critical' || priority === 'high') && <View style={styles.priorityIndicator} />}

				<View style={styles.content}>
					<View style={styles.iconContainer}>{getIcon()}</View>

					<View style={styles.textContainer}>
						<Text style={styles.title} numberOfLines={2}>{title || 'Nueva Notificación'}</Text>
						<Text style={styles.body} numberOfLines={2}>{body || ''}</Text>
					</View>

					{hasImage && (
						<Image
							source={{ uri: displayImageUrl }}
							style={styles.image}
							resizeMode="cover"
							onError={(e) => console.error('❌ Error cargando imagen del banner:', e.nativeEvent.error)}
							onLoad={() => console.log('✅ Imagen del banner cargada correctamente')}
						/>
					)}

					<TouchableOpacity
						onPress={(e) => {
							e.stopPropagation();
							console.log('❌ Banner cerrado manualmente');
							onDismiss();
						}}
						style={styles.closeButton}
					>
						<X size={20} color="#FFFFFF" />
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 99999, // ✅ Muy por encima del resto
		elevation: 99999, // ✅ Android overlay fix
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	banner: {
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 12,
		marginHorizontal: 5,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 8,
			},
			android: {
				elevation: 12,
			},
		}),
	},
	priorityIndicator: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		width: 4,
		backgroundColor: '#EF4444',
		borderTopLeftRadius: 12,
		borderBottomLeftRadius: 12,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconContainer: {
		marginRight: 12,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	textContainer: {
		flex: 1,
		marginRight: 8,
	},
	title: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	body: {
		color: '#E5E7EB',
		fontSize: 14,
		lineHeight: 18,
	},
	image: {
		width: 50,
		height: 50,
		borderRadius: 8,
		marginRight: 8,
	},
	closeButton: {
		padding: 4,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 12,
	},
});

export default InAppNotificationBanner;
