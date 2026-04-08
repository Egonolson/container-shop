import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Production-check: Warn if default secrets are used
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'supersecret') {
    throw new Error('FATAL: JWT_SECRET must be set to a strong random value in production!')
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET === 'supersecret') {
    throw new Error('FATAL: COOKIE_SECRET must be set to a strong random value in production!')
  }
}

module.exports = defineConfig({
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    // Disable admin panel in production if not needed via env
    disable: process.env.DISABLE_ADMIN === "true",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      connection: { ssl: process.env.DB_SSL === "true" },
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/delivery_location",
    },
    {
      resolve: "./src/modules/waste_code",
    },
    {
      resolve: "./src/modules/gewabfv",
    },
    {
      resolve: "./src/modules/delivery_schedule",
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/email-notification",
            id: "email-notification",
            options: {
              channels: ["email"],
              name: "Email Notification Provider",
              host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
              port: Number(process.env.SMTP_PORT || 587),
              user: process.env.SMTP_USER || "",
              pass: process.env.SMTP_PASS || "",
              from: process.env.SMTP_FROM || "noreply@seyfarth-container.de",
              from_name: process.env.SMTP_FROM_NAME || "Seyfarth Container-Dienst",
            },
          },
        ],
      },
    },
  ],
})
