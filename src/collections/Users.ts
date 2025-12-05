import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  // La colección de autenticación ya incluye email y password
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre Completo',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      label: 'Rol',
      options: [
        { label: 'Admin (Sistema)', value: 'admin' },
        { label: 'Dador de Carga (Dispatcher)', value: 'dispatcher' },
        { label: 'Chofer (Driver)', value: 'driver' },
      ],
      defaultValue: 'driver',
    },
  ],
}
