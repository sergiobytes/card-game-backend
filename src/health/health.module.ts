import { Module } from '@nestjs/common';
import { RoomsModule } from '../rooms/rooms.module';
import { HealthController } from './health.controller';

@Module({
  imports: [RoomsModule],
  controllers: [HealthController],
})
export class HealthModule {}
