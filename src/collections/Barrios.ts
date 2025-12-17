import type { CollectionConfig, Access } from 'payload'

// Solo usuarios autenticados pueden leer
const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

// Solo admin puede crear/actualizar/eliminar
const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin'
}

export const Barrios: CollectionConfig = {
  slug: 'barrios',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'orden'],
  },
  access: {
    read: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      label: 'Nombre del Barrio',
      unique: true,
    },
    {
      name: 'orden',
      type: 'number',
      required: true,
      label: 'Orden',
      admin: {
        description: 'Número para ordenar los barrios en los listados',
      },
    },
  ],
}
