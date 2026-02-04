import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  )

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

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new CorrelationIdInterceptor())

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
  })

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Roxabi API')
    .setDescription('Roxabi SaaS Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = configService.get<number>('PORT', 3001)
  await app.listen(port, '0.0.0.0')
  logger.log(`Application is running on: http://localhost:${port}`)
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`)
}
bootstrap()
