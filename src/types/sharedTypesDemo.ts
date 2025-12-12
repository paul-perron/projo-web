// projo-web/src/types/sharedTypesDemo.ts
import type {
  ID,
  Assignment,
  Asset,
  Vendor
} from 'personnel-shared';

export const exampleId: ID = '123';

export const makeFakeAssignment = (id: ID): Assignment => ({
  id,
  project_id: 'proj-1',
  position_id: 'pos-1',
  worker_id: 'worker-1',
  assignment_start_date: '2025-01-01',
  rotation_schedule: '14/14',
  status: 'active',
  created_by: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
});

export const makeFakeAsset = (id: ID): Asset => ({
  id,
  name: 'Test Asset',
  asset_number: 'ASSET-001',
  category_id: 'cat-1',
  condition: 'operational',
  status: 'active',
  created_by: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
});

export const makeFakeVendor = (id: ID): Vendor => ({
  id,
  name: 'Test Vendor',
  status: 'active',
  created_by: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
});