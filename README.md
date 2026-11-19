# Gestor de Tareas MateCode

## Descripción del proyecto

Gestor de Tareas MateCode es una página desarrollada por la empresa MateCode para ayudar a los usuarios a organizar sus horarios y tareas.

Cada persona crea su cuenta, guarda sus propias tareas y las ve ordenadas por fecha de vencimiento. Puede filtrarlas, marcarlas como hechas, editarlas, eliminarlas y reordenarlas. El objetivo es tener en un solo lugar lo que hay que hacer y cuándo vence.

## URL de producción

| Producción | https://gestordetareasmatecode.vercel.app/ |
| --- | --- |

## Decisiones arquitectónicas

El proyecto se construyó por bloques. Cada bloque se dejó funcionando y con tests antes de pasar al siguiente, para no mezclar login, datos y publicación en un solo paso.

1. **Base.** Aplicación de React, TypeScript y Vite, con las pantallas de inicio, ingreso, registro y tareas.
2. **Cuentas.** Firebase Authentication para registro, ingreso y Google. Las rutas de tareas quedan protegidas.
3. **Tareas.** Cloud Firestore guarda las tareas de cada usuario. Las reglas solo dejan leer y escribir las propias.
4. **Resumen por email.** El botón llama a una función del servidor (`POST /api/send-summary`), pensada para enviar el correo con AWS SES.
5. **Pruebas y publicación.** Tests con Vitest y React Testing Library, y deploy de la página en Vercel.
6. **Extras.** Filtros, fecha de vencimiento, reorden con arrastre y una vista que se adapta a celular, tablet y PC.

La página vive en el navegador. Firebase se usa solo para cuentas y datos. Vercel publica la página y la función de email. El correo no sale del navegador: lo arma el servidor, para no exponer las claves de AWS.

```text
mi-biblioteca-codigo4/
├── api/
│   ├── send-summary.ts          Función que recibe el pedido de resumen
│   └── _lib/                    Verificación del token, texto del mail y SES
├── src/
│   ├── components/              Formularios, lista, encabezado y botón de resumen
│   ├── context/                 Sesión del usuario
│   ├── hooks/                   Lectura de la sesión y de las tareas
│   ├── pages/                   Inicio, ingreso, registro y tareas
│   ├── services/                Firebase, tareas, filtros, orden y pedido de email
│   ├── types/
│   ├── test/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── firestore.rules
├── firebase.json
├── vercel.json
├── package.json
└── .env.example
```

## Instrucciones de instalación

Hace falta Node.js. En la carpeta del proyecto:

```bash
npm install
```

Copiá `.env.example` a `.env` y completá los valores. En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` no se sube al repositorio. Para ver la página en local:

```bash
npm run dev
```

Queda en `http://127.0.0.1:5173`.

Otros comandos:

- `npm test` corre los tests.
- `npm run lint` revisa el código.
- `npm run build` genera la versión de producción en `dist`.

## Variables de entorno

Están declaradas, vacías, en `.env.example`. El navegador solo recibe las que empiezan con `VITE_`. Las de AWS y `FIREBASE_PROJECT_ID` las lee únicamente la función del servidor, y no llevan el prefijo `VITE_`.

En Vercel hay que cargar las mismas variables antes del build. `FIREBASE_PROJECT_ID` es el mismo id que `VITE_FIREBASE_PROJECT_ID`.

| Variable | Dónde se usa |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Frontend, en el build |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend, en el build |
| `VITE_FIREBASE_PROJECT_ID` | Frontend, en el build |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend, en el build |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend, en el build |
| `VITE_FIREBASE_APP_ID` | Frontend, en el build |
| `AWS_ACCESS_KEY_ID` | Función `/api/send-summary` |
| `AWS_SECRET_ACCESS_KEY` | Función `/api/send-summary` |
| `AWS_REGION` | Función `/api/send-summary` |
| `AWS_SES_FROM_EMAIL` | Función `/api/send-summary` |
| `FIREBASE_PROJECT_ID` | Función `/api/send-summary` |

## Flujo de envío de emails

La pantalla de tareas tiene el botón **Enviar resumen por email**. Si las claves estuvieran cargadas, el recorrido sería este:

1. El navegador pide el token de la sesión de Firebase.
2. Envía `POST /api/send-summary` con ese token y la lista de tareas (título y si está completa).
3. El servidor comprueba el token y arma el resumen.
4. AWS SES manda el correo a la dirección de la cuenta que inició sesión. El destinatario no se elige desde el formulario.

Ese envío **todavía no funciona**. Por problemas con AWS de Amazon no fue posible crear la cuenta, así que no hay claves de SES. La página, el login y las tareas funcionan. El resumen por email queda preparado en el código, pero por el momento no se encuentra habilitado.
