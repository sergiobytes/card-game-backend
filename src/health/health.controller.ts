import { Controller, Get } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';

@Controller('health')
export class HealthController {
  constructor(private readonly roomsService: RoomsService) {}

  /** Lo consulta Render para saber si el servidor está vivo. */
  @Get()
  check() {
    return { status: 'ok', rooms: this.roomsService.roomCount() };
  }
}
