import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  constructor(private readonly jwtService: JwtService) {}
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<number, Set<string>>();
  private connectedClients: Map<string, Socket> = new Map();

  async handleConnection(client: Socket) {
    let token = client.handshake.auth.headers;
    token = token.split(' ')[1];
    if (token) {
      const decoded = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.id;
      if (userId) {
        if (!this.userSocketMap.has(Number(userId))) {
          this.userSocketMap.set(Number(userId), new Set());
        }
        this.userSocketMap.get(Number(userId)).add(client.id);
        this.logger.log(`User ${userId} connected with socket ${client.id}`);
      }
    } else {
      this.logger.error('No token provided');
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketIds] of this.userSocketMap.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.userSocketMap.delete(userId);
        }
        this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    return { event: 'joinRoom', data: { room } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    return { event: 'leaveRoom', data: { room } };
  }

  // Method to send notification to specific user
  sendNotificationToUser(userId: number, notification: unknown) {
    const socketIds = this.userSocketMap.get(userId);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('newNotification', notification);
      });
    } else {
      this.logger.log(`User ${userId} is not connected`);
    }
  }

  // Method to send notification to all connected clients
  broadcastNotification(notification: unknown) {
    this.server.emit('notification', notification);
  }

  // Method to send notification to specific room
  sendNotificationToRoom(room: string, notification: unknown) {
    this.server.to(room).emit('notification', notification);
  }
}
