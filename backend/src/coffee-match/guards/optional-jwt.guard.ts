import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err) {
      throw err;
    }
    // If a token is provided but it's invalid/expired, throw an error
    if (info) {
      if (info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
    }
    // If no token, user is false. We return null for guest sessions.
    return user || null;
  }
}
