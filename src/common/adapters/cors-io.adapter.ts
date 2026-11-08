import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

/** Socket.IO con la misma lista de orígenes permitidos que la API HTTP. */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: Partial<ServerOptions>): Server {
    // Socket.IO acepta opciones parciales, pero el tipo de Nest pide todas.
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, methods: ['GET', 'POST'] },
    } as ServerOptions);
  }
}
