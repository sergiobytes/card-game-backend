import { Injectable } from '@nestjs/common';
import { GameRuleError } from '../../game/engine/game-rule.error';
import { findMember } from '../../game/engine/rules';
import { RoomsRepository } from '../rooms.repository';
import { JoinedRoom } from './create-room.usecase';

/** Reconecta una pestaña que recargó la página, usando su token. */
@Injectable()
export class RejoinRoomUseCase {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  execute(input: { code: string; token: string }): JoinedRoom {
    const room = this.roomsRepository.findByCode(input.code);
    const playerId = room.tokens.get(input.token);
    if (!playerId || !findMember(room.state, playerId)) {
      throw new GameRuleError('Ya no estás en esta sala.');
    }
    return { room, playerId, token: input.token };
  }
}
