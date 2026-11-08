import { Test } from '@nestjs/testing';
import { zeroRng } from '../game/testing/game.fixtures';
import { RNG, ROOM_SWEEP_EVERY_MS } from './rooms.constants';
import { RoomsModule } from './rooms.module';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';
import { RemoveIdleRoomsUseCase } from './usecases/remove-idle-rooms.usecase';

describe('RoomsService', () => {
  let service: RoomsService;
  let repository: RoomsRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RoomsModule],
    })
      .overrideProvider(RNG)
      .useValue(zeroRng)
      .compile();

    service = moduleRef.get(RoomsService);
    repository = moduleRef.get(RoomsRepository);
  });

  it('lleva una sala de la creación a la primera jugada', () => {
    const ana = service.create('Ana');
    const beto = service.join(ana.room.code, 'Beto');
    const anaActor = { code: ana.room.code, playerId: ana.playerId };
    const betoActor = { code: ana.room.code, playerId: beto.playerId };

    service.updateRules(anaActor, { drawUntilPlayable: true });
    const room = service.start(anaActor);
    expect(room.state.status).toBe('playing');

    // Reparte Ana, así que empieza Beto.
    service.draw(betoActor);
    if (room.state.drawnCardId) service.pass(betoActor);
    expect(room.state.players[room.state.turn].id).toBe(ana.playerId);

    expect(service.rejoin(ana.room.code, beto.token).playerId).toBe(
      beto.playerId,
    );
  });

  it('conecta cada método con su usecase', () => {
    const ana = service.create('Ana');
    const beto = service.join(ana.room.code, 'Beto');
    const code = ana.room.code;
    const anaActor = { code, playerId: ana.playerId };
    const betoActor = { code, playerId: beto.playerId };
    const room = service.start(anaActor);

    // Beto tiene el turno; sin cartas que sirvan para probar, se espera
    // que las reglas rechacen las jugadas, lo que demuestra que llegaron.
    expect(() => service.play(anaActor, 'nada')).toThrow('Espera tu turno.');
    expect(() => service.declareLast(betoActor)).toThrow(
      'Solo puedes cantar ¡Última! con 2 cartas o menos.',
    );
    expect(() => service.catchPlayer(anaActor, beto.playerId)).toThrow(
      'Demasiado tarde: ya no se puede atrapar.',
    );
    expect(() => service.skipTurn(anaActor, beto.playerId)).not.toThrow();
    expect(room.state.log.at(-1)).toContain('Se saltó el turno de Beto');

    service.kick(anaActor, beto.playerId);
    expect(room.state.players).toHaveLength(1);

    service.leave(anaActor);
    expect(repository.exists(code)).toBe(false);
  });

  it('cada cierto tiempo limpia las salas inactivas', () => {
    jest.useFakeTimers();
    const sweep = jest
      .spyOn(RemoveIdleRoomsUseCase.prototype, 'execute')
      .mockReturnValue(0);

    service.onModuleInit();
    jest.advanceTimersByTime(ROOM_SWEEP_EVERY_MS);
    expect(sweep).toHaveBeenCalledTimes(1);

    service.onModuleDestroy();
    jest.advanceTimersByTime(ROOM_SWEEP_EVERY_MS);
    expect(sweep).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
    sweep.mockRestore();
  });
});
