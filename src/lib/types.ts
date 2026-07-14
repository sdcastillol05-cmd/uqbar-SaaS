export type TipoMovimiento = "ingreso" | "gasto";
export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "otro";

export interface Movimiento {
  id: string;
  user_id: string;
  tipo: TipoMovimiento;
  concepto: string;
  valor: number;
  nota: string | null;
  fecha: string;
  medio_pago: MedioPago;
  cliente: string | null;
  es_fiado: boolean;
  created_at: string;
}

export interface Perfil {
  id: string;
  user_id: string;
  nombre_negocio: string;
  email: string;
  maps_url?: string | null;
  onboarding_completado?: boolean;  // ← nuevo campo
  created_at: string;
}

export interface NuevoMovimiento {
  tipo: TipoMovimiento;
  concepto: string;
  valor: number;
  nota?: string | null;
  fecha: string;
  medio_pago: MedioPago;
  cliente?: string | null;
  es_fiado: boolean;
}
