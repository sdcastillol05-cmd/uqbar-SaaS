// Tipos del módulo de Clientes, Anotaciones y Recordatorios

export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string; // formato internacional: 573001234567
  notas: string | null;
  ultimo_servicio: string | null;
  ultima_visita: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface NuevoCliente {
  nombre: string;
  telefono: string;
  notas?: string | null;
  ultimo_servicio?: string | null;
  ultima_visita?: string | null;
}

export interface AnotacionServicio {
  id: string;
  user_id: string;
  cliente_id: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  valor: number | null;
  created_at: string;
}

export interface NuevaAnotacion {
  cliente_id: string;
  descripcion: string;
  fecha: string;
  valor?: number | null;
}

export interface Recordatorio {
  id: string;
  user_id: string;
  cliente_id: string;
  motivo: string;
  fecha_envio: string; // ISO timestamp UTC
  enviado: boolean;
  enviado_at: string | null;
  error: string | null;
  created_at: string;
  // relaciones opcionales (cuando se hace select con join)
  clientes?: Pick<Cliente, 'nombre' | 'telefono'>;
}

export interface NuevoRecordatorio {
  cliente_id: string;
  motivo: string;
  fecha_envio: string; // ISO timestamp UTC
}

// Para mostrar en la UI — un recordatorio con los datos del cliente embebidos
export interface RecordatorioConCliente extends Recordatorio {
  clientes: Pick<Cliente, 'nombre' | 'telefono'>;
}
