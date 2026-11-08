import { Inject, Injectable } from '@nestjs/common';
import type { Rng } from '../../game/engine/random';
import { skipTurn } from '../../game/engine/turn';
import { GameState } from '../../game/types/game-state.types';
import { Room } from '../entities/room.entity';
import { onlineIds } from '../room-connections';
import { RNG } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';
import { RoomActionUseCase } from './room-action.usecase';
import { TargetInput } from './catch-player.usecase';

@Injectable()
export class SkipTurnUseCase extends RoomActionUseCase<TargetInput> {
  constructor(
    roomsRepository: RoomsRepository,
    @Inject(RNG) private readonly rng: Rng,
  ) {
    super(roomsRepository);
  }

  protected apply(state: GameState, input: TargetInput, room: Room): void {
    skipTurn(state, input.playerId, input.targetId, onlineIds(room), this.rng);
  }
}
