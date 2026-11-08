import { Inject, Injectable } from '@nestjs/common';
import type { Rng } from '../../game/engine/random';
import { startRound } from '../../game/engine/round';
import { GameState } from '../../game/types/game-state.types';
import { RNG } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

@Injectable()
export class StartRoundUseCase extends RoomActionUseCase {
  constructor(
    roomsRepository: RoomsRepository,
    @Inject(RNG) private readonly rng: Rng,
  ) {
    super(roomsRepository);
  }

  protected apply(state: GameState, { playerId }: RoomActorInput): void {
    startRound(state, playerId, this.rng);
  }
}
