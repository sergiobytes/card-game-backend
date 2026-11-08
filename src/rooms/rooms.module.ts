import { Module } from '@nestjs/common';
import { cryptoRng } from '../game/engine/random';
import { RNG } from './rooms.constants';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';
import { CatchPlayerUseCase } from './usecases/catch-player.usecase';
import { CreateRoomUseCase } from './usecases/create-room.usecase';
import { DeclareLastUseCase } from './usecases/declare-last.usecase';
import { DrawCardUseCase } from './usecases/draw-card.usecase';
import { JoinRoomUseCase } from './usecases/join-room.usecase';
import { KickPlayerUseCase } from './usecases/kick-player.usecase';
import { LeaveRoomUseCase } from './usecases/leave-room.usecase';
import { PassTurnUseCase } from './usecases/pass-turn.usecase';
import { PlayCardUseCase } from './usecases/play-card.usecase';
import { RejoinRoomUseCase } from './usecases/rejoin-room.usecase';
import { RemoveIdleRoomsUseCase } from './usecases/remove-idle-rooms.usecase';
import { SkipTurnUseCase } from './usecases/skip-turn.usecase';
import { StartRoundUseCase } from './usecases/start-round.usecase';
import { UpdateRulesUseCase } from './usecases/update-rules.usecase';

@Module({
  providers: [
    { provide: RNG, useValue: cryptoRng },
    RoomsRepository,
    RoomsService,
    CreateRoomUseCase,
    JoinRoomUseCase,
    RejoinRoomUseCase,
    LeaveRoomUseCase,
    KickPlayerUseCase,
    UpdateRulesUseCase,
    StartRoundUseCase,
    PlayCardUseCase,
    DrawCardUseCase,
    PassTurnUseCase,
    DeclareLastUseCase,
    CatchPlayerUseCase,
    SkipTurnUseCase,
    RemoveIdleRoomsUseCase,
  ],
  exports: [RoomsService, RoomsRepository],
})
export class RoomsModule {}
