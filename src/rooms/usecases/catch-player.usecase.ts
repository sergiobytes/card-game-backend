import { Inject, Injectable } from '@nestjs/common';
import { catchPlayer } from '../../game/engine/last-card';
import type { Rng } from '../../game/engine/random';
import { GameState } from '../../game/types/game-state.types';
import { RNG } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

export interface TargetInput extends RoomActorInput {
  targetId: string;
}

@Injectable()
export class CatchPlayerUseCase extends RoomActionUseCase<TargetInput> {
  constructor(
    roomsRepository: RoomsRepository,
    @Inject(RNG) private readonly rng: Rng,
  ) {
    super(roomsRepository);
  }

  protected apply(state: GameState, input: TargetInput): void {
    catchPlayer(state, input.playerId, input.targetId, this.rng);
  }
}
