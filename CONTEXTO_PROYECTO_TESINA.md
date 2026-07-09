# Contexto del Proyecto: Nexo Estadías 2026 y Tesina

Este documento sirve como un registro centralizado y completo del estado actual del proyecto **Nexo Estadías 2026**, así como de los avances realizados, los cambios en la arquitectura, la base de datos y los puntos clave que te servirán como insumo directo para redactar tu **Tesina (Capítulo 3: Desarrollo de la Propuesta / Módulos Implementados)**.

---

## 1. Estado General del Proyecto

El proyecto se encuentra en una etapa avanzada de integración. Se tomó la decisión de adaptar tus módulos (Opción A) dentro de la base general del proyecto de tu compañero, logrando así un sistema unificado. 

**Tecnologías Base:**
*   **Frontend:** React con Vite y TypeScript (alojado en `/frontend`).
*   **Backend:** Node.js con Express y TypeScript (alojado en `/backend`).
*   **Base de Datos:** PostgreSQL.

---

## 2. Configuración de Base de Datos y Entorno

Para realizar pruebas semi-reales (con los correos reales de Jefes de Carrera, Asesores y Alumnos), se transicionó a una base de datos con información verídica:
*   **Base de datos activa:** `estadias_db_real` (creada a partir del dump SQL `base_real`).
*   **Credenciales de Prueba:** Se ejecutó un script interno que estandarizó la contraseña de **TODOS** los usuarios registrados a `123456` para facilitar el testing sin comprometer la lógica de encriptación (Bcrypt).
*   **Alteraciones de Esquema:** Para soportar el nuevo formato FODVI08-H, se le inyectaron a la tabla `tramites_estadia` las siguientes columnas que faltaban en el esquema original:
    *   `linea_investigacion`
    *   `area_empresa`
    *   `eval_parcial`, `eval_final` (Fechas)
    *   `seguimiento_alumno`, `seguimiento_dias`
    *   `contacto_asesor`, `contacto_dias`

---

## 3. Integración del Formato Oficial (FODVI08-H)

Se implementó un mecanismo avanzado para la generación dinámica del formato oficial para los alumnos (Paso 5). Esta funcionalidad es un **hito importante para la tesina**, ya que automatiza un proceso burocrático de la UTCV.

**Mejoras y Soluciones Técnicas en la Generación del PDF:**
*   **Inyección de Datos (po.js):** El script `po.js` consume directamente la API (`/api/alumno/tramite`) detectando dinámicamente la IP de la red (`window.location.hostname`) para funcionar de forma local o remota.
*   **Parseo Inteligente JSON:** El horario del alumno, que ahora se guarda como un arreglo JSON estructurado, se procesa automáticamente para renderizarse como un texto legible (ej: *Lunes: 08:00 a 16:00, Martes...*).
*   **Limpieza Heurística de Textos:** Dado que la BD guarda campos con acentos (ej. "Cuitláhuac", "Pública") y los `radio/checkboxes` del HTML oficial esperan valores sin acentos, se creó una utilidad de normalización para mapear los datos perfectamente.
*   **Heurística de Género:** Al no existir la columna `sexo` en la BD de alumnos, el sistema aplica una IA básica basándose en el primer nombre (terminaciones en 'a' o un diccionario de nombres) para auto-rellenar el sexo en el documento.
*   **Optimización de Impresión CSS (@media print):**
    *   Se eliminaron bordes, sobras y resaltados de todos los campos interactivos (`textarea`, `input`) a la hora de imprimir.
    *   Se forzó el tamaño `A4` a 2 páginas cerradas ajustando el `padding`, márgenes, tipografías y aplicando `overflow: visible` para que no se corte el texto.
    *   Se integró auto-escalado vertical dinámico para la "Descripción de la Problemática", permitiendo que el cuadro crezca según el contenido ingresado.

---

## 4. Puntos para Continuar (Guía para el Capítulo 3 de la Tesina)

Para terminar tu tesina, en el **Capítulo 3 (Desarrollo y Diagramas)** debes documentar los siguientes módulos que has construido o adaptado. Puedes usar la información descrita arriba:

1.  **Módulo de Recuperación de Contraseña (Contraseña Olvidada):**
    *   Flujo: Solicitud de código -> Envío de email -> Verificación -> Cambio de password.
2.  **Módulo de Registro Masivo (Carga de Excel):**
    *   Flujo: El admin sube un archivo `.xlsx`, el backend lo parsea, valida las celdas e inserta usuarios por lotes usando transacciones SQL para evitar inconsistencias.
3.  **Módulo de Actualización de Estatus:**
    *   La transición de estados del trámite de un alumno (Revisión Digital, Documentos Entregados, etc.).
4.  **Generador Automático de Formatos (FODVI08-H):** *(Mencionado en la sección 3)*
    *   Puedes describir cómo se transformó el HTML estático de la universidad en una plantilla reactiva conectada al backend vía REST API.

---

## 5. Scripts de Ayuda Disponibles

En la raíz del `backend/` cuentas con herramientas que te ayudarán durante tu desarrollo:
*   `updatePasswords.js`: (Ya ejecutado) Restablece todas las contraseñas a `123456`.
*   `resetAlumno.js`: Permite limpiar todo el progreso de estadía de una matrícula específica (ej. `20243L601013`) para que puedas simular el proceso desde cero repetidas veces.
*   `addColumns.js`: Script de migración de esquema usado para sincronizar la base real.
