import { Inject, Injectable } from '@nestjs/common';
import type { Rng } from '../../game/engine/random';
import { playCard } from '../../game/engine/turn';
import { CardColor } from '../../game/types/card.types';
import { GameState } from '../../game/types/game-state.types';
import { RNG } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

export interface PlayCardInput extends RoomActorInput {
  cardId: string;
  color?: CardColor;
}

@Injectable()
export class PlayCardUseCase extends RoomActionUseCase<PlayCardInput> {
  constructor(
    roomsRepository: RoomsRepository,
    @Inject(RNG) private readonly rng: Rng,
  ) {
    super(roomsRepository);
  }

  protected apply(state: GameState, input: PlayCardInput): void {
    playCard(state, input.playerId, input.cardId, input.color, this.rng);
  }
}
