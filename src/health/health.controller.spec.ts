import { RoomsService } from '../rooms/rooms.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde que está vivo y cuántas salas hay', () => {
    const rooms = { roomCount: () => 3 } as unknown as RoomsService;

    expect(new HealthController(rooms).check()).toEqual({
      status: 'ok',
      rooms: 3,
    });
  });
});
