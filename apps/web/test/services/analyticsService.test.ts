import { describe, it, expect, vi } from 'vitest';
import { analyticsService } from './analyticsService';

// Mock browser APIs
const mockBlob = new Blob(['test data'], { type: 'text/plain' });
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
};

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(mockBlob),
  })
) as any;

global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

document.createElement = vi.fn(() => mockLink as any);
document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('analyticsService', () => {
  it('should use the .xlsx extension for excel files', async () => {
    await analyticsService.exportData('excel', { test: 'data' });
    expect(mockLink.download).toContain('.xlsx');
  });
});
