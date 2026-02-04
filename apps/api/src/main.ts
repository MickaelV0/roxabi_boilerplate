import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL || 'debug',
      },
    })
  )

  app.enableShutdownHooks()

  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
  })

  // Swagger setup (non-production only)
  const nodeEnv = configService.get<string>('NODE_ENV', 'development')
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Roxabi API')
      .setDescription('Roxabi SaaS Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = configService.get<number>('PORT', 3001)
  await app.listen(port, '0.0.0.0')
  logger.log(`Application is running on: http://localhost:${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err)
  process.exit(1)
})
