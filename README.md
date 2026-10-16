# 🔥 Sazón & Fuego — Plataforma Gastronómica con Web Services y Seguridad (Unidad 3)

**Universidad Tecnológica de San Luis Río Colorado (UTSLRC)**  
**Carrera:** Ingeniería en Desarrollo y Gestión de Software (IDGS 9-2)  
**Materia:** Desarrollo Web Integral — **Unidad 3: Seguridad, Web Services y APIs**  
**Profesor:** Jose Julian Reyes Patiño  
**Alumno:** Luis Angel Leon Almazan  

---

## 📋 Descripción General del Proyecto

**Sazón & Fuego** es una aplicación web integral desarrollada con **Node.js, Express y Frontend SPA Responsivo** centrada en la **Gastronomía Internacional, Ciencia Culinaria y Patrimonio Alimentario**.

El proyecto fue diseñado específicamente para cumplir y demostrar de forma práctica todos los requisitos técnicos y de seguridad de la **Unidad 3**:
1. **Consumo de APIs Externas vía Proxy Backend (`TheMealDB API` + `Open Exchange Rates API`)**: El cliente web jamás expone llaves privadas en el navegador; todas las solicitudes pasan por el servidor Express (`/api/recipes/search` y `/api/recipes/category`), que lee las credenciales desde variables de entorno (`.env`).
2. **Protección de Secretos con `.env` y `.gitignore`**: Las claves `MEALDB_API_KEY`, `MEALDB_BASE_URL`, `EXCHANGE_API_URL` y `JWT_SECRET` se almacenan en `.env` y están excluidas del control de versiones mediante `.gitignore`. Se incluye `.env.example` como plantilla segura.
3. **Formulario de Registro de Usuario con Validación Dual (Cliente y Servidor)**: Validación interactiva en tiempo real de 8 campos, medidor visual de fortaleza de contraseña (política OWASP), sanitización contra ataques XSS, hash criptográfico de contraseñas con `crypto.scryptSync` + sal aleatoria de 128 bits, emisión de tokens **JWT (HS256)** y consentimiento expreso de **Aviso de Privacidad / Derechos ARCO (LFPDPPP)**.

---

## 🖥️ Estructura de Pantallas de la Aplicación

1. **Pantalla 1 — Inicio (`#inicio`)**:
   - Hero principal de *Sazón & Fuego*, indicadores de seguridad y tarjeta en vivo con el platillo insignia obtenido desde `/api/recipes/search?q=Arrabiata` junto con el tipo de cambio actual USD/MXN.
2. **Pantalla 2 — Información del Tema y Explorador de Recetas API (`#tema`)**:
   - Marco teórico sobre la **Reacción de Maillard**, **Emulsiones Culinarias**, **Fermentación Láctica (Umami)** y **Rutas de las Especias**.
   - **Explorador de Recetas en Vivo** con buscador por ingrediente/platillo y filtros rápidos por categoría (*Seafood, Mexican, Beef, Chicken, Vegetarian, Pasta, Dessert*), calculando el costo estimado de ingredientes en MXN y USD.
3. **Pantalla 3 — Registro de Usuario con Validación (`#registro`)**:
   - Formulario con validación reactiva y del lado del servidor para: Nombre completo, Usuario, Correo electrónico, Teléfono (10 dígitos), Especialidad culinaria, Contraseña segura (8+ caracteres, mayúscula, minúscula, número y símbolo), Confirmación de contraseña y Aceptación de Aviso de Privacidad (LFPDPPP).
   - Panel de **Auditoría Criptográfica en Vivo** que muestra el hash `scrypt` generado y el token `JWT` firmado, además del directorio de chefs con correos y teléfonos enmascarados.
4. **Pantalla 4 — Seguridad y Web Services Unidad 3 (`#seguridad`)**:
   - Diagrama de arquitectura segura Cliente → Servidor `.env` → API Externa, verificación de variables de entorno en vivo y un inspector interactivo de respuestas JSON.

---

## ⚙️ Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias
```bash
npm install
```

### 2. Configurar las variables de entorno (`.env`)
Copia el archivo de plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```

Contenido de `.env`:
```env
PORT=3000
MEALDB_API_KEY=1
MEALDB_BASE_URL=https://www.themealdb.com/api/json/v1
EXCHANGE_API_URL=https://open.er-api.com/v6/latest/USD
JWT_SECRET=utslrc_idgs92_desarrollo_web_integral_secret_key_2026
```

### 3. Iniciar el servidor
```bash
npm start
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🔌 Endpoints del Web Service (Backend API)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/recipes/search?q=Chicken` | Busca recetas en **TheMealDB API** usando `MEALDB_API_KEY` de `.env` y calcula costos en MXN/USD. |
| `GET` | `/api/recipes/category?c=Seafood` | Filtra recetas internacionales por categoría gastronómica e hidrata ingredientes y pasos. |
| `POST` | `/api/auth/register` | Valida los 8 campos del registro, sanitiza contra XSS, aplica hash `scrypt` y firma un token `JWT`. |
| `GET` | `/api/auth/users` | Lista los usuarios registrados con correos/teléfonos enmascarados y vista previa del hash `scrypt`. |
| `GET` | `/api/security/status` | Devuelve el estado en vivo de `.env`, cabeceras `Helmet`, `Rate Limiting` y controles de la Unidad 3. |
