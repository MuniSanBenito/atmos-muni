# 🚛 Atmos San Benito

**Sistema de Gestión de Servicios Atmosféricos para la Municipalidad de San Benito**

---

## 📋 ¿Qué es Atmos?

Atmos es una plataforma web diseñada para gestionar de manera eficiente el servicio de desagotes atmosféricos de la Municipalidad de San Benito. El sistema permite coordinar solicitudes de servicio entre los vecinos, los despachadores municipales y los choferes de los camiones atmosféricos.

### 🎯 Funcionalidades Principales

- **Gestión de Solicitudes**: Registro y seguimiento de pedidos de desagote atmosférico
- **Panel de Despacho**: Los despachadores pueden crear, asignar y organizar el orden de las solicitudes
- **App para Choferes**: Interfaz móvil optimizada para que los conductores vean sus tareas asignadas
- **Seguimiento en Tiempo Real**: Estados de solicitud (Pendiente → En Camino → Realizada/No Realizada)
- **Estadísticas**: Dashboard con métricas del servicio (solicitudes del mes, tasa de éxito, etc.)
- **Tipos de Servicio**: Soporte para servicios subsidiados y pagados
- **Captura de GPS**: Los choferes pueden registrar coordenadas al completar servicios
- **PWA (Progressive Web App)**: Instalable en dispositivos móviles para uso offline

### 👥 Roles del Sistema

| Rol                 | Descripción                                               |
| ------------------- | --------------------------------------------------------- |
| **Admin**           | Acceso completo al sistema y panel de administración      |
| **Dispatcher**      | Crea y gestiona solicitudes, organiza el orden de trabajo |
| **Driver (Chofer)** | Ve las solicitudes asignadas y actualiza su estado        |

---

## 🚀 Despliegue

### Requisitos Previos

- Node.js 18+ (recomendado 22.x)
- pnpm (gestor de paquetes)
- MongoDB (local o en la nube)

### Opción 1: Desarrollo Local

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/MuniSanBenito/atmos-muni.git
   cd atmos-muni
   ```

2. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Editar el archivo `.env` con tus configuraciones:

   ```env
   MONGODB_URI=mongodb://localhost:27017/atmos-muni
   PAYLOAD_SECRET=tu-clave-secreta-aqui
   ```

3. **Instalar dependencias e iniciar**

   ```bash
   pnpm install
   pnpm dev
   ```

4. **Acceder a la aplicación**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Panel Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

### Opción 2: Con Docker (Recomendado)

Esta opción incluye MongoDB automáticamente.

1. **Clonar y configurar**

   ```bash
   git clone https://github.com/MuniSanBenito/atmos-muni.git
   cd atmos-muni
   cp .env.example .env
   ```

2. **Configurar la URI de MongoDB para Docker**

   En el archivo `.env`, usar:

   ```env
   MONGODB_URI=mongodb://mongo:27017/atmos-muni
   ```

3. **Levantar los contenedores**

   ```bash
   docker-compose up
   ```

   Para ejecutar en segundo plano:

   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación** en [http://localhost:3000](http://localhost:3000)

### Opción 3: Producción con Docker

1. **Construir la imagen de producción**

   ```bash
   docker build -t atmos-muni .
   ```

2. **Ejecutar el contenedor**
   ```bash
   docker run -p 3000:3000 --env-file .env atmos-muni
   ```

---

## 📱 Instalación como App Móvil (PWA)

Los choferes pueden instalar Atmos directamente en sus celulares:

1. Abrir [https://tu-dominio.com](https://tu-dominio.com) en Chrome
2. Tocar el menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio"
3. La app funcionará incluso sin conexión para consultar información

---

## 🏛️ Municipalidad de San Benito

Desarrollado para optimizar el servicio de desagotes atmosféricos y mejorar la atención a los vecinos de San Benito.

---

_Sistema construido con Next.js, Payload CMS y MongoDB_
