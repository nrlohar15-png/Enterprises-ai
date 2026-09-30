import { db } from '../db/index.js';

export async function logActivity(
  organizationId: string,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  details: Record<string, any> = {}
) {
  try {
    await db.query(
      `INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [organizationId, userId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (error: any) {
    console.error('Failed to record activity log:', error.message);
  }
}
