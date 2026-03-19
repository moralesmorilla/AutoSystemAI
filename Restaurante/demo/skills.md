# Skills para AutoSystem - CRM y sistema de reservas para restaurantes

Este archivo define las funcionalidades, características y objetivos del CRM/demo de reservas llamado **AutoSystem** que debe generar Antigravity.

## Objetivo general
Crear una aplicación web moderna, profesional y funcional que permita a los restaurantes gestionar:

- Reservas
- Mesas
- Clientes
- Estadísticas

Todo dentro de un **dashboard tipo SaaS**, con interfaz limpia, responsive y fácil de usar.

## Funcionalidades principales

### 1. Dashboard
- Resumen del restaurante:
  - Reservas del día
  - Mesas ocupadas/libres
  - Clientes totales
  - Ocupación del restaurante (%)
- Próximas reservas con información:
  - Hora
  - Cliente
  - Mesa
  - Número de personas
- Gráfico de reservas por hora del día

### 2. Reservas
- Mostrar calendario del día con todas las mesas y horarios
- Cada celda debe mostrar:
  - Estado: Libre (verde) / Reservada (rojo)
  - Nombre del cliente
  - Número de personas
- Funciones:
  - Crear nueva reserva
  - Editar reserva
  - Cancelar reserva
  - Ver detalles
- Botón destacado: "➕ Nueva reserva"

### 3. Formulario de nueva reserva
- Campos:
  - Nombre del cliente
  - Teléfono
  - Número de personas
  - Fecha
  - Hora
  - Mesa
  - Notas
- Al guardar la reserva:
  - Se añade al dashboard
  - Se guarda el cliente en el CRM
  - Si el cliente ya existe, incrementar contador de visitas
  - Actualizar última visita

### 4. CRM de clientes
- Tabla con:
  - Nombre
  - Teléfono
  - Número de visitas
  - Última visita
- Funcionalidades:
  - Buscar cliente por nombre o teléfono
  - Ver historial de reservas
  - Ver notas del cliente

### 5. Gestión de mesas
- Permitir:
  - Añadir mesa
  - Eliminar mesa
  - Editar mesa
  - Definir capacidad de cada mesa

### 6. Estadísticas
- Información visual:
  - Total reservas hoy
  - Reservas semana actual
  - Clientes recurrentes
  - Mesas más utilizadas
- Incluir gráficos simples con JavaScript

## Requisitos técnicos
- Construido solo con:
  - HTML
  - CSS
  - JavaScript (vanilla)
- Usar LocalStorage para guardar:
  - Reservas
  - Clientes
  - Mesas
- Datos deben persistir al recargar la página
- Incluir datos de ejemplo para la demo

## Diseño
- Estilo moderno tipo SaaS
- Colores:
  - Verde: mesas libres
  - Rojo: mesas ocupadas
  - Azul: botones principales
- Interfaz limpia, profesional y fácil de usar
- Responsive: adaptado a ordenador y tablet

## Extras opcionales (mejoran la demo)
- Gráficos de ocupación diaria y semanal
- Notificaciones visuales al crear/cancelar reservas
- Resumen rápido de clientes VIP o frecuentes
- Filtro de reservas por mesa, hora o cliente
- Mini chat/bot de ejemplo para mostrar cómo un cliente podría reservar vía web