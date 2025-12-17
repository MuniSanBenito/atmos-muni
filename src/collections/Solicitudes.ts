import type { CollectionConfig, Access } from 'payload'

// Tipos de roles
type UserRole = 'admin' | 'dispatcher' | 'driver'

// Solo usuarios autenticados pueden leer
const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

// Solo admin y dispatcher pueden crear
const canCreate: Access = ({ req: { user } }) => {
  if (!user) return false
  return ['admin', 'dispatcher'].includes(user.role as UserRole)
}

// Admin y dispatcher pueden actualizar todo, driver solo ciertos campos
const canUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  // Driver puede actualizar (pero los campos se restringen en el hook)
  return ['admin', 'dispatcher', 'driver'].includes(user.role as UserRole)
}

// Solo admin puede eliminar
const canDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin'
}

export const Solicitudes: CollectionConfig = {
  slug: 'solicitudes',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'apellido', 'telefono', 'estado', 'createdAt'],
  },
  access: {
    read: isAuthenticated,
    create: canCreate,
    update: canUpdate,
    delete: canDelete,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      label: 'Nombre',
    },
    {
      name: 'apellido',
      type: 'text',
      required: true,
      label: 'Apellido',
    },
    {
      name: 'telefono',
      type: 'text',
      required: true,
      label: 'Teléfono',
    },
    {
      name: 'direccion',
      type: 'text',
      required: true,
      label: 'Dirección',
    },
    {
      name: 'barrio',
      type: 'relationship',
      relationTo: 'barrios',
      required: true,
      label: 'Barrio',
      admin: {
        description: 'Seleccione el barrio de San Benito',
      },
    },
    {
      name: 'tipoPago',
      type: 'select',
      required: true,
      label: 'Tipo de Servicio',
      options: [
        { label: 'Subsidiado', value: 'subsidiado' },
        { label: 'Pagado', value: 'pagado' },
      ],
      defaultValue: 'subsidiado',
    },
    {
      name: 'coordenadas',
      type: 'text',
      label: 'Coordenadas GPS',
      admin: {
        description: 'Formato: Latitud, Longitud (Ej: -26.123456, -54.654321)',
      },
    },
    {
      name: 'notas',
      type: 'textarea',
      label: 'Notas Adicionales',
    },
    {
      name: 'estado',
      type: 'select',
      required: true,
      label: 'Estado',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'En Camino', value: 'en_camino' },
        { label: 'Realizada', value: 'realizada' },
        { label: 'No Realizada', value: 'no_realizada' },
      ],
      defaultValue: 'pendiente',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'fechaRealizacion',
      type: 'date',
      label: 'Fecha de Realización',
      admin: {
        position: 'sidebar',
        condition: (data) => data.estado === 'realizada',
      },
    },
    {
      name: 'motivoNoRealizacion',
      type: 'textarea',
      label: 'Motivo de No Realización',
      admin: {
        position: 'sidebar',
        condition: (data) => data.estado === 'no_realizada',
      },
    },
  ],
  timestamps: true,
}
