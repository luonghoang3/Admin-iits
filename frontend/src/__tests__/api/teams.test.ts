import { createClient } from '@supabase/supabase-js';
import { createTeam, updateTeam, deleteTeam, fetchTeams, checkTeamsTable } from '@/utils/supabase/client';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('Team API Tests', () => {
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

  describe('checkTeamsTable', () => {
    it('should return true when teams table exists', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await checkTeamsTable();

      expect(result.exists).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('should return false when teams table does not exist', async () => {
      const mockError = new Error('relation "teams" does not exist');
      mockSupabase.select.mockResolvedValue({ data: null, error: mockError });

      const result = await checkTeamsTable();

      expect(result.exists).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('fetchTeams', () => {
    it('should fetch all teams successfully', async () => {
      const mockTeams = [
        {
          id: '1',
          name: 'Team 1',
          description: 'First team',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.select.mockResolvedValue({ data: mockTeams, error: null });

      const result = await fetchTeams();

      expect(result.teams).toEqual(mockTeams);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('should handle errors when fetching teams', async () => {
      const mockError = new Error('Database error');
      mockSupabase.select.mockResolvedValue({ data: null, error: mockError });

      const result = await fetchTeams();

      expect(result.teams).toBeNull();
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('createTeam', () => {
    const mockTeamData = {
      name: 'New Team',
      description: 'A new team description',
    };

    it('should create a team successfully', async () => {
      const mockCreatedTeam = {
        ...mockTeamData,
        id: '123',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      };
      mockSupabase.single.mockResolvedValue({ data: mockCreatedTeam, error: null });

      const result = await createTeam(mockTeamData);

      expect(result.team).toEqual(mockCreatedTeam);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: mockTeamData.name,
        description: mockTeamData.description,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }));
    });

    it('should handle errors when creating a team', async () => {
      const mockError = new Error('Team name already exists');
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      const result = await createTeam(mockTeamData);

      expect(result.team).toBeNull();
      expect(result.error).toBe(mockError.message);
    });

    it('should handle empty team name', async () => {
      const result = await createTeam({ ...mockTeamData, name: '' });

      expect(result.team).toBeNull();
      expect(result.error).toBe('Tên team không được để trống');
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
  });

  describe('updateTeam', () => {
    const teamId = '123';
    const mockUpdateData = {
      name: 'Updated Team Name',
      description: 'Updated description',
    };

    it('should update a team successfully', async () => {
      const mockUpdatedTeam = {
        id: teamId,
        ...mockUpdateData,
        updated_at: expect.any(String),
      };
      mockSupabase.single.mockResolvedValue({ data: mockUpdatedTeam, error: null });

      const result = await updateTeam(teamId, mockUpdateData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        ...mockUpdateData,
        updated_at: expect.any(String),
      }));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', teamId);
    });

    it('should handle errors when updating a team', async () => {
      const mockError = new Error('Team not found');
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError });

      const result = await updateTeam(teamId, mockUpdateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });

  describe('deleteTeam', () => {
    const teamId = '123';

    it('should delete a team successfully', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null });

      const result = await deleteTeam(teamId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', teamId);
    });

    it('should handle errors when deleting a team', async () => {
      const mockError = new Error('Team not found');
      mockSupabase.eq.mockResolvedValue({ error: mockError });

      const result = await deleteTeam(teamId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });
}); 