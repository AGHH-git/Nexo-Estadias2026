# Contexto del Proyecto: Nexo-Estadias2026 & Tesina del Usuario

Este proyecto es parte integral de la tesina del usuario. Es un sistema para la gestión de estadías (Nexo Estadías 2026) desarrollado para la UTCV.

## Arquitectura actual
- **Backend:** Node.js, Express, TypeScript, PostgreSQL (`estadias_db`). Se levanta en el puerto 3000.
- **Frontend:** React 18, Vite, Tailwind CSS, TypeScript. Se levanta en el puerto 4200.
- **Infraestructura:** Todo funciona a través de Docker Compose (`docker compose up --build -d`). 

## Reglas de Comportamiento y Decisiones de Diseño
1. **Verificación Estricta Institucional:** El flujo de seguridad exige que antes del primer cambio de contraseña, el alumno DEBE vincularse con la API de Google OAuth (`@react-oauth/google`). La API extrae el correo, valida que coincida la matrícula con el identificador de la BD, y emite un token de seguridad con `googleVerificado: true`.
2. **Scripts de Mantenimiento:** Si la base de datos se borra, en `backend/src/scripts/init_schema.ts` hay un script maestro para recrear las tablas e insertar usuarios de prueba (ej. `20260001` o `20243l601013`).
3. **Manejo de Docker en Windows:** Para evitar que HMR en Vite falle o `bcrypt` cause `invalid ELF header`, se usa `.dockerignore` estricto en frontend y backend. Si se requieren cambios grandes, reiniciar contenedores o usar `-V`.
4. **Diseño:** Siempre utiliza interfaces limpias, modernas y "Premium" usando Tailwind y componentes como `lucide-react`.

> **Nota para el agente futuro:** El usuario requerirá ayuda para redactar o documentar el funcionamiento de estos módulos (Especialmente OAuth, Autenticación y flujos de seguridad) para su documento de tesis/tesina. Mantén siempre este contexto vivo y ofrécele ayuda tanto técnica como en redacción cuando lo solicite.
