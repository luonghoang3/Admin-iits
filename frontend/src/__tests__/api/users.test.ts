import { createClient } from '@supabase/supabase-js';
import { createUser, updateUser, deleteUser, fetchUsers } from '@/utils/supabase/client';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('User API Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock Supabase responses
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('fetchUsers', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'user1',
          full_name: 'User One',
          role: 'user',
          is_active: true,
          team_ids: ['team1', 'team2'],
        },
      ];

      mockSupabase.select.mockResolvedValue({ data: mockUsers, error: null });

      const result = await fetchUsers();

      expect(result.users).toEqual(mockUsers);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('should handle errors when fetching users', async () => {
      const mockError = new Error('Database error');
      mockSupabase.select.mockResolvedValue({ data: null, error: mockError });

      const result = await fetchUsers();

      expect(result.users).toBeNull();
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('createUser', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'newuser',
      full_name: 'New User',
      role: 'user',
      is_active: true,
      team_ids: ['team1'],
    };

    it('should create a user successfully', async () => {
      const mockCreatedUser = { ...mockUserData, id: '123' };
      mockSupabase.single.mockResolvedValue({ data: mockCreatedUser, error: null });

      const result = await createUser(mockUserData);

      expect(result.user).toEqual(mockCreatedUser);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        username: mockUserData.username,
        full_name: mockUserData.full_name,
        role: mockUserData.role,
        team_ids: mockUserData.team_ids,
        is_active: mockUserData.is_active,
      }));
    });

    it('should handle errors when creating a user', async () => {
      const mockError = new Error('Username already exists');
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      const result = await createUser(mockUserData);

      expect(result.user).toBeNull();
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('updateUser', () => {
    const userId = '123';
    const mockUpdateData = {
      full_name: 'Updated Name',
      team_ids: ['team2', 'team3'],
    };

    it('should update a user successfully', async () => {
      const mockUpdatedUser = { id: userId, ...mockUpdateData };
      mockSupabase.single.mockResolvedValue({ data: mockUpdatedUser, error: null });

      const result = await updateUser(userId, mockUpdateData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        ...mockUpdateData,
        updated_at: expect.any(String),
      }));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId);
    });

    it('should handle errors when updating a user', async () => {
      const mockError = new Error('User not found');
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      const result = await updateUser(userId, mockUpdateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('deleteUser', () => {
    const userId = '123';

    it('should delete a user successfully', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null });

      const result = await deleteUser(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId);
    });

    it('should handle errors when deleting a user', async () => {
      const mockError = new Error('User not found');
      mockSupabase.eq.mockResolvedValue({ error: mockError });

      const result = await deleteUser(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });
}); 