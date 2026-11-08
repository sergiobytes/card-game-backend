import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [RoomsModule, HealthModule],
})
export class AppModule {}
