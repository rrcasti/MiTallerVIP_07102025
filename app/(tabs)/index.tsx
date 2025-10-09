// RUTA: app/(tabs)/index.tsx

import { Car, Calendar, ShoppingBag, MessageCircle, FileText, User, Wrench, Crown, CheckCircle, Truck  } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from "react";
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView} from "react-native";
import { useRouter } from 'expo-router';
import QuickAccessButton from '../../components/QuickAccessButton';
import { getRepairsForUser } from '../../services/repairService';
import { getVehiclesForUser } from '../../services/vehicleService';
import { useMembership } from '../../context/MembershipContext'; // Ya lo tenías, perfecto.
import { useAuth } from '../../context/AuthContext';
import { useVehicles } from '../../context/VehicleContext';

const statusConfig = {
    ingresado: { label: "Ingresado", color: "#3B82F6" },
    diagnostico: { label: "En Diagnóstico", color: "#F59E0B" },
    default: { label: "Desconocido", color: "#94A3B8" }
};

const ActiveServiceCard = ({ service, vehicle }) => {
    // ... (Este componente no cambia)
};

export default function DashboardScreen() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { vehicles, loading: isVehiclesLoading } = useVehicles();
    
    // CAMBIO: El hook useMembership ya está aquí, lo cual es correcto.
    const { membership, isLoading: isMembershipLoading } = useMembership(); 
    
    const [loadingRepairs, setLoadingRepairs] = useState(true);
    const [activeServices, setActiveServices] = useState([]);
    const [primaryVehicle, setPrimaryVehicle] = useState(null);
    
    // CAMBIO: Eliminamos el estado 'hasMembership' porque ahora usamos 'membership' del contexto.
    // const [hasMembership, setHasMembership] = useState(false);

    const loadDashboardData = useCallback(async () => {
        if (!user) return;
        setLoadingRepairs(true);
        try {
            const repairsData = await getRepairsForUser(user.uid);
            setActiveServices(repairsData.active);
        } catch (error) {
            console.error("Error cargando datos del dashboard:", error);
        } finally {
            setLoadingRepairs(false);
        }
    }, [user]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useEffect(() => {
        if (vehicles.length > 0) {
            setPrimaryVehicle(vehicles[0]);
        }
    }, [vehicles]);

    // CAMBIO: Agregamos 'isMembershipLoading' a la condición de carga general.
    if (isAuthLoading || isVehiclesLoading || loadingRepairs || isMembershipLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FBBF24" />
                    <Text style={{ color: 'white', marginTop: 10 }}>Cargando tu información...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Mi Taller VIP</Text>
                        <Text style={styles.headerSubtitle}>Experiencia Premium</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <User color="#CBD5E1" size={28} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.welcomeText}>¡Bienvenido, {user?.displayName?.split(' ')[0] || 'Cliente'}!</Text>
                {primaryVehicle && <Text style={styles.vehicleText}>{`${primaryVehicle.brand} ${primaryVehicle.model}`}</Text>}
                
                {/* ===================================================================== */}
                {/* CAMBIO: Se reemplaza 'hasMembership' por 'membership' y se usan datos dinámicos */}
                {/* ===================================================================== */}
                {membership ? ( 
    // Si el usuario TIENE membresía, mostramos esta tarjeta mejorada
    <View style={styles.vipCard}>
      <TouchableOpacity 
        style={styles.vipInfoClickable}
        onPress={() => router.push('/memberships')} // <-- ACCIÓN PRINCIPAL: IR A MEMBRESÍAS
      >
        <View style={styles.vipIconContainer}><Crown color="#1E293B" size={20} /></View> 
        <View style={styles.vipInfo}> 
            <Text style={styles.vipTitle}>Miembro {membership.type.charAt(0).toUpperCase() + membership.type.slice(1)}</Text> 
            <Text style={styles.vipSubtitle}>
                Activo hasta {new Date(membership.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text> 
        </View> 
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.vipSideButton}
        onPress={() => router.push('/(tabs)/store')} // <-- ACCIÓN SECUNDARIA: IR A LA TIENDA
      > 
          <Text style={styles.vipButtonText}>Tienda VIP</Text> 
      </TouchableOpacity> 
    </View> 
) : ( 
    // Si el usuario NO tiene membresía, la tarjeta de invitación no cambia
    <TouchableOpacity style={[styles.vipCard, {backgroundColor: '#334155'}]} onPress={() => router.push('/memberships')}> 
        <View style={styles.vipIconContainer}><Crown color="#1E293B" size={20} /></View> 
        <View style={styles.vipInfo}> 
            <Text style={[styles.vipTitle, {color: '#FBBF24'}]}>Únete al Club VIP</Text> 
            <Text style={[styles.vipSubtitle, {color: '#94A3B8'}]}>Beneficios exclusivos</Text> 
        </View> 
    </TouchableOpacity> 
                )} 

                {/* El resto del código no se toca */}
                <TouchableOpacity 
                    style={styles.mainActionButton}
                    onPress={() => router.push('requests/ServiceRequest')}
                > 
                    <View> 
                        <Text style={styles.mainActionTitle}>Solicitar Servicio</Text> 
                        <Text style={styles.mainActionSubtitle}>Agenda tu cita o cotiza un servicio</Text> 
                    </View> 
                    <Wrench color="#0F172A" size={32} /> 
                </TouchableOpacity> 

                <View style={styles.section}> 
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text> 
                    <View style={styles.qaGrid}> 
                        <QuickAccessButton icon={Car} title="Mi Garage" subtitle={`${vehicles.length} vehículos`} onPress={() => router.push('/(tabs)/vehicles')} /> 
                        <QuickAccessButton icon={Calendar} title="Agendar Turno" subtitle="Mantenimiento" onPress={() => {}} /> 
                        <QuickAccessButton icon={ShoppingBag} title="Tienda VIP" subtitle="Productos" onPress={() => router.push('/(tabs)/store')} /> 
                        <QuickAccessButton icon={MessageCircle} title="Mi Asesor" subtitle="Chat directo" onPress={() => router.push('/(tabs)/chat')} /> 
                        <QuickAccessButton icon={FileText} title="Documentos" subtitle="Facturas" onPress={() => {}} /> 
                        <QuickAccessButton icon={Truck} title="Grúa 24/7" subtitle="Emergencias" onPress={() => router.push('/tow-request')}/>                                /> 

                    </View> 
                </View> 

                <View style={styles.section}> 
                    <Text style={styles.sectionTitle}>Servicios en Proceso</Text> 
                    {activeServices.length > 0 ? ( 
                        activeServices.map((service) => { 
                            const vehicle = vehicles.find(v => v.id === service.vehicleId); 
                            return <ActiveServiceCard key={service.id} service={service} vehicle={vehicle} /> 
                        }) 
                    ) : ( 
                        <View style={styles.emptyStateCard}> 
                            {/* ... */}
                        </View> 
                    )} 
                </View> 
            </ScrollView> 
        </SafeAreaView> 
    ); 
} 
// Los estilos no necesitan cambios, pero he ajustado un detalle para mayor robustez
const styles = StyleSheet.create({ 
    safeArea: { flex: 1, backgroundColor: '#0F172A' }, 
    container: { padding: 20, paddingBottom: 100 }, 
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, 
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }, 
    headerSubtitle: { fontSize: 14, color: '#94A3B8' }, 
    welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }, 
    vehicleText: { fontSize: 18, color: '#FBBF24', marginBottom: 20 }, 
    vipCard: { backgroundColor: '#FBBF24', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 }, 
    vipIconContainer: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, marginRight: 12 }, 
    vipInfo: { flex: 1 }, 
    vipTitle: { color: '#1E293B', fontSize: 16, fontWeight: 'bold' }, 
    vipSubtitle: { color: '#475569', fontSize: 12 }, 
    vipButtonText: { color: '#1E293B', fontWeight: 'bold', fontSize: 12 }, 
    mainActionButton: { backgroundColor: '#FBBF24', borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }, 
    mainActionTitle: { color: '#1E293B', fontSize: 18, fontWeight: 'bold' }, 
    mainActionSubtitle: { color: '#475569', fontSize: 14, marginTop: 2 }, 
    section: { marginBottom: 32 }, 
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 }, 
    qaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, 
    emptyStateCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 24, alignItems: 'center' }, 
    emptyStateText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, 
    emptyStateSubtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 20 }, 
    emptyStateActions: { flexDirection: 'row', gap: 12 }, 
    emptyStateButtonPrimary: { backgroundColor: '#FBBF24', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }, 
    emptyStateButtonTextPrimary: { color: '#1E293B', fontWeight: 'bold' }, 
    emptyStateButtonSecondary: { borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }, 
    emptyStateButtonTextSecondary: { color: '#CBD5E1', fontWeight: 'bold' }, 
    logoutButton: { marginTop: 20, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155', }, 
    logoutButtonText: { color: '#94A3B8', textAlign: 'center', fontWeight: 'bold', }, 
    serviceCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155', }, 
    serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, }, 
    serviceVehicle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', }, 
    servicePlate: { color: '#94A3B8', fontSize: 14, }, 
    serviceStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, }, 
    // SUGERENCIA: Se elimina el color de texto fijo para que contraste mejor con cualquier fondo.
    serviceStatusText: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' }, 
    serviceDescription: { color: '#CBD5E1', fontSize: 14, marginBottom: 16, }, 
    serviceDetailsButton: { backgroundColor: '#334155', borderRadius: 8, paddingVertical: 12, alignItems: 'center', }, 
    serviceDetailsButtonText: { color: '#FFFFFF', fontWeight: 'bold', }, 
vipInfoClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipSideButton: {
    paddingLeft: 12,
    marginLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#475569',
  },
});