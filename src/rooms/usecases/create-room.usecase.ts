import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createGame } from '../../game/engine/players';
import type { Rng } from '../../game/engine/random';
import { GameRuleError } from '../../game/engine/game-rule.error';
import { Room } from '../entities/room.entity';
import { RNG, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';

export interface JoinedRoom {
  room: Room;
  playerId: string;
  token: string;
}

export const newId = () => randomBytes(9).toString('base64url');
export const newToken = () => randomBytes(24).toString('base64url');

@Injectable()
export class CreateRoomUseCase {
  private readonly logger = new Logger(CreateRoomUseCase.name);

  constructor(
    private readonly roomsRepository: RoomsRepository,
    @Inject(RNG) private readonly rng: Rng,
  ) {}

  execute(input: { name: string }, now = Date.now()): JoinedRoom {
    const code = this.freeCode();
    const playerId = newId();
    const token = newToken();

    const room = this.roomsRepository.create(
      code,
      createGame(playerId, input.name),
      now,
    );
    room.tokens.set(token, playerId);

    this.logger.log(`Sala ${code} creada`);
    return { room, playerId, token };
  }

  private freeCode(): string {
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = Array.from(
        { length: ROOM_CODE_LENGTH },
        () => ROOM_CODE_ALPHABET[this.rng(ROOM_CODE_ALPHABET.length)],
      ).join('');
      if (!this.roomsRepository.exists(code)) return code;
    }
    throw new GameRuleError('No se pudo crear la sala. Intenta otra vez.');
  }
}
