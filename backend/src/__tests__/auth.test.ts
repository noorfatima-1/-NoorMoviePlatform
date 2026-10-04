import { Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

// Mock supabase
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

import { supabaseAdmin } from '../config/supabase';

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should return 401 if no token provided', async () => {
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set user on req and call next for valid token', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: 'user-123',
        email: 'test@test.com',
        role: 'user',
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should return 403 if user is not admin', async () => {
      mockReq.user = { id: 'user-123', email: 'test@test.com', role: 'user' };

      await requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
      });
    });

    it('should call next if user is admin', async () => {
      mockReq.user = { id: 'user-123', email: 'test@test.com', role: 'admin' };

      await requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
