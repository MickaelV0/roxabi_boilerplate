import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  )

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new CorrelationIdInterceptor())

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

  const port = process.env.PORT || 3001
  await app.listen(port, '0.0.0.0')
  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`)
}
bootstrap()
