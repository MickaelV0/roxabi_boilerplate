import helmet from '@fastify/helmet'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'
import { parseCorsOrigins } from './cors.js'
import { registerRateLimitHeadersHook } from './throttler/index.js'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL || 'debug',
      },
      bodyLimit: 1_048_576, // 1 MiB — explicit limit
      trustProxy: 1, // trust single proxy hop (Vercel) for correct client IP from x-forwarded-for
    })
  )

  app.enableShutdownHooks()

  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  // Security headers (must be registered before routes)
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false, // disabled to allow cross-origin resources (fonts, images)
  })

  // Permissions-Policy (not included in helmet v8)
  app
    .getHttpAdapter()
    .getInstance()
    .addHook(
      'onSend',
      (
        _request: unknown,
        reply: { header: (k: string, v: string) => void },
        _payload: unknown,
        done: () => void
      ) => {
        reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
        done()
      }
    )

  // Rate limit headers via onSend hook
  registerRateLimitHeadersHook(app)

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // CORS
  const nodeEnv = configService.get<string>('NODE_ENV', 'development')
  const isProduction = nodeEnv === 'production'
  const rawOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000')
  const corsResult = parseCorsOrigins(rawOrigins, isProduction)

  if (corsResult.warning) {
    logger.warn(corsResult.warning)
  }
  app.enableCors({ origin: corsResult.origins, credentials: true })

  // Swagger setup — gated by SWAGGER_ENABLED env var
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', nodeEnv !== 'production')
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Roxabi API')
      .setDescription('Roxabi SaaS Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui.css',
      customJs: [
        'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui-standalone-preset.js',
      ],
    })
    logger.log('Swagger UI enabled at /api/docs')
  } else {
    logger.log('Swagger UI disabled (set SWAGGER_ENABLED=true to enable)')
  }

  const port = configService.get<number>('PORT', 4000)
  await app.listen(port, '0.0.0.0')
  logger.log(`Application is running on: http://localhost:${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err)
  process.exit(1)
})
