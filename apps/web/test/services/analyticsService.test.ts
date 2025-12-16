import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsService } from '../../src/services/analyticsService';

// Mock browser APIs
const mockBlob = new Blob(['test data'], { type: 'text/plain' });
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
} as any;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock DOM
document.createElement = vi.fn(() => mockLink);
document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(mockBlob),
      statusText: 'OK',
    });
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  it('should fetch project analytics with correct headers', async () => {
    await analyticsService.getProjectAnalytics();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analytics/projects'),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        }
      })
    );
  });

  it('should append query parameters correctly', async () => {
    await analyticsService.getProjectAnalytics({
      projectId: '123',
      granularity: 'month'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('projectId=123'),
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('granularity=month'),
      expect.anything()
    );
  });

  it('should use the .xlsx extension for excel export', async () => {
    await analyticsService.exportData('excel', { test: 'data' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analytics/export/excel'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { test: 'data' } })
      })
    );
    expect(mockLink.download).toContain('.xlsx');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });

    await expect(analyticsService.getProjectAnalytics()).rejects.toThrow('Analytics API error: Not Found');
  });
});
