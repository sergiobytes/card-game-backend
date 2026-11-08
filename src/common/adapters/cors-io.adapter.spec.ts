import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server } from 'socket.io';
import { CorsIoAdapter } from './cors-io.adapter';

describe('CorsIoAdapter', () => {
  it('crea el servidor de Socket.IO con los orígenes permitidos', () => {
    const server = {} as Server;
    const parent = jest
      .spyOn(IoAdapter.prototype, 'createIOServer')
      .mockReturnValue(server);
    const adapter = new CorsIoAdapter({} as never, ['https://ana.github.io']);

    const result = adapter.createIOServer(0, { path: '/socket.io' });

    expect(result).toBe(server);
    expect(parent).toHaveBeenCalledWith(0, {
      path: '/socket.io',
      cors: { origin: ['https://ana.github.io'], methods: ['GET', 'POST'] },
    });
    parent.mockRestore();
  });
});
