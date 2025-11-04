import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Wrench,
  Car,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const serviceTypes = [
  { id: 'mantenimiento_preventivo', label: '🔧 Mantenimiento Preventivo', icon: Wrench, priority: 'normal' },
  { id: 'reparacion_mecanica', label: '⚙️ Reparación Mecánica', icon: AlertCircle, priority: 'urgente' },
  { id: 'diagnostico', label: '🔍 Diagnóstico Computarizado', icon: Zap, priority: 'normal' },
  { id: 'cambio_aceite', label: '🛢️ Cambio de Aceite', icon: Wrench, priority: 'normal' },
  { id: 'frenos', label: '🛑 Frenos', icon: Shield, priority: 'urgente' },
  { id: 'neumaticos', label: '🚗 Neumáticos', icon: Car, priority: 'normal' },
  { id: 'alineacion_balanceo', label: '⚖️ Alineación y Balanceo', icon: Wrench, priority: 'normal' },
  { id: 'suspension', label: '🔩 Suspensión', icon: AlertCircle, priority: 'urgente' },
  { id: 'aire_acondicionado', label: '❄️ Aire Acondicionado', icon: Sparkles, priority: 'puede_esperar' },
  { id: 'sistema_electrico', label: '⚡ Sistema Eléctrico', icon: Zap, priority: 'urgente' },
  { id: 'chapa_pintura', label: '🎨 Chapa y Pintura', icon: Sparkles, priority: 'puede_esperar' },
  { id: 'lavado_detailing', label: '✨ Lavado y Detailing', icon: Sparkles, priority: 'puede_esperar' },
  { id: 'revision_tecnica', label: '📋 Revisión Técnica', icon: Shield, priority: 'normal' },
  { id: 'instalacion_accesorios', label: '🔧 Instalación de Accesorios', icon: Wrench, priority: 'puede_esperar' },
  { id: 'otro', label: '📝 Otro Servicio', icon: AlertCircle, priority: 'normal' },
];

export default function ServiceRequest() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    selected_services: [],
    priority: 'normal',
    description: '',
    preferred_date: '',
    preferred_time: 'indiferente',
    photos: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const userVehicles = await base44.entities.Vehicle.filter({ created_by: currentUser.email });
      setVehicles(userVehicles);
      
      if (userVehicles.length > 0) {
        setFormData(prev => ({ ...prev, vehicle_id: userVehicles[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      selected_services: prev.selected_services.includes(serviceId)
        ? prev.selected_services.filter(id => id !== serviceId)
        : [...prev.selected_services, serviceId]
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || formData.selected_services.length === 0) {
      alert('Por favor selecciona al menos un servicio');
      return;
    }

    setSubmitting(true);
    try {
      const requestId = [];
      for (const serviceId of formData.selected_services) {
        const selectedService = serviceTypes.find(s => s.id === serviceId);
        
        const request = await base44.entities.ServiceRequest.create({
          user_id: user.id,
          vehicle_id: formData.vehicle_id,
          service_type: serviceId,
          priority: selectedService?.priority || formData.priority,
          description: formData.description,
          preferred_date: formData.preferred_date || null,
          preferred_time: formData.preferred_time,
          photos: formData.photos,
          status: 'pendiente'
        });
        
        requestIds.push(request.id);
      }

      // CREAR NOTIFICACIÓN
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'service_update',
        priority: 'medium',
        title: '✅ Solicitud de Servicio Recibida',
        message: `Hemos recibido tu solicitud de ${formData.selected_services.length} servicio(s). Te contactaremos pronto para confirmar.`,
        action_url: '/MyActivity',
        related_id: requestIds[0],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        auto_dismiss: false
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error al enviar la solicitud');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700 text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-slate-300 mb-6">
              Hemos recibido tu solicitud de servicio. Nos pondremos en contacto contigo pronto para confirmar la cita.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Solicitar Servicio</CardTitle>
            <p className="text-slate-400">Agenda tu cita o cotiza un servicio</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de Vehículo */}
              <div>
                <Label className="text-white">Vehículo</Label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full p-3 bg-slate-700 border-slate-600 rounded-md text-white"
                  required
                >
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Servicios */}
              <div>
                <Label className="text-white mb-3 block">Servicios Requeridos (selecciona todos los que necesites)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceTypes.map(service => {
                    const Icon = service.icon;
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceToggle(service.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.selected_services.includes(service.id)
                            ? 'bg-yellow-600/20 border-yellow-500'
                            : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={formData.selected_services.includes(service.id)}
                            className="border-slate-400"
                          />
                          <Icon className="w-5 h-5 text-yellow-400" />
                          <span className="text-white text-sm">{service.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label className="text-white">Descripción del Problema o Servicio Requerido</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe los síntomas, ruidos, o detalles del servicio que necesitas..."
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                  required
                />
              </div>

              {/* Fecha y Hora Preferida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Fecha Preferida (Opcional)</Label>
                  <Input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Horario Preferido</Label>
                  <select
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="w-full p-2 bg-slate-700 border-slate-600 rounded-md text-white"
                  >
                    <option value="indiferente">Indiferente</option>
                    <option value="mañana">Mañana (8:00 - 12:00)</option>
                    <option value="tarde">Tarde (14:00 - 18:00)</option>
                  </select>
                </div>
              </div>

              {/* Fotos */}
              <div>
                <Label className="text-white">Fotos del Problema (Opcional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {formData.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {formData.photos.map((photo, idx) => (
                      <img key={idx} src={photo} alt="Preview" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de Envío */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white py-3 text-lg"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}