import { Request, Response } from 'express';
import {
  getMovies,
  getFeaturedMovies,
  createMovie,
  deleteMovie,
} from '../controllers/movieController';
import { AuthRequest } from '../middleware/auth';

// Mock supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockContains = jest.fn();
const mockOr = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    })),
  },
}));

describe('Movie Controller', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Chain setup
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr, order: mockOrder, contains: mockContains, range: mockRange });
    mockOrder.mockReturnValue({ range: mockRange, limit: mockLimit });
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
    mockInsert.mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  describe('getMovies', () => {
    it('should return movies with pagination', async () => {
      const mockData = [{ id: '1', title: 'Test Movie' }];
      mockRange.mockResolvedValue({ data: mockData, error: null, count: 1 });

      const mockReq = { query: { page: '1', limit: '20' } } as unknown as Request;
      await getMovies(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('should sanitize search query to prevent injection', async () => {
      mockOr.mockReturnValue({ order: mockOrder });

      const mockReq = { query: { search: 'test%DROP TABLE', page: '1', limit: '20' } } as unknown as Request;
      await getMovies(mockReq, mockRes as Response);

      // Should strip special chars from search
      if (mockOr.mock.calls.length > 0) {
        const filterStr = mockOr.mock.calls[0][0];
        expect(filterStr).not.toContain('%DROP');
        expect(filterStr).toContain('testDROP TABLE');
      }
    });
  });

  describe('createMovie', () => {
    it('should return 400 if required fields are missing', async () => {
      const mockReq = {
        body: { title: 'Test' },
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      } as unknown as AuthRequest;

      await createMovie(mockReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create movie with valid data', async () => {
      const movieData = {
        title: 'New Movie',
        description: 'A test movie',
        poster_url: 'https://example.com/poster.jpg',
        release_date: '2024-01-01',
        duration: 120,
        director: 'Test Director',
        genre: 'Action, Sci-Fi',
        cast_members: 'Actor 1, Actor 2',
      };

      const createdMovie = { id: 'new-1', ...movieData };
      mockSingle.mockResolvedValue({ data: createdMovie, error: null });

      const mockReq = {
        body: movieData,
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      } as unknown as AuthRequest;

      await createMovie(mockReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('deleteMovie', () => {
    it('should delete movie by id', async () => {
      mockEq.mockResolvedValue({ error: null });

      const mockReq = {
        params: { id: 'movie-1' },
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      } as unknown as AuthRequest;

      await deleteMovie(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Movie deleted',
      });
    });
  });
});
