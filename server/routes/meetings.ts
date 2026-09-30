import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { CreateMeetingSchema } from '../../shared/schemas/index.js';
import { aiService } from '../services/ai/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/meetings
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const query = `
      SELECT m.*,
        dept.name as department_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as organizer_name,
        (SELECT count(*) FROM meeting_action_items mai WHERE mai.meeting_id = m.id) as action_item_count,
        (SELECT count(*) FROM meeting_action_items mai WHERE mai.meeting_id = m.id AND mai.status = 'converted_to_task') as converted_action_item_count
      FROM meetings m
      LEFT JOIN departments dept ON dept.id = m.department_id
      LEFT JOIN projects p ON p.id = m.project_id
      LEFT JOIN users u ON u.id = m.organizer_id
      WHERE m.organization_id = $1
      ORDER BY m.meeting_date DESC
    `;

    const result = await db.query(query, [orgId]);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch meetings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve meetings' });
  }
});

// GET /api/meetings/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const meetRes = await db.query(`
      SELECT m.*,
        dept.name as department_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as organizer_name
      FROM meetings m
      LEFT JOIN departments dept ON dept.id = m.department_id
      LEFT JOIN projects p ON p.id = m.project_id
      LEFT JOIN users u ON u.id = m.organizer_id
      WHERE m.id = $1 AND m.organization_id = $2
    `, [id, orgId]);

    if (meetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetRes.rows[0];

    // Fetch action items
    const itemsRes = await db.query(`
      SELECT mai.*, t.status as task_status
      FROM meeting_action_items mai
      LEFT JOIN tasks t ON t.id = mai.task_id
      WHERE mai.meeting_id = $1 AND mai.organization_id = $2
      ORDER BY mai.created_at ASC
    `, [id, orgId]);
    meeting.action_items = itemsRes.rows;

    return res.json(meeting);
  } catch (error: any) {
    console.error('Fetch meeting details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve meeting details' });
  }
});

// POST /api/meetings
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const validated = CreateMeetingSchema.parse(req.body);

    // Analyze meeting notes with AI
    const analysis = await aiService.analyzeMeeting(validated.raw_notes, validated.title);

    // Insert meeting
    const meetRes = await db.query(
      `INSERT INTO meetings (
        organization_id, department_id, project_id, organizer_id, title, meeting_date, attendees, raw_notes, summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        orgId,
        validated.department_id || null,
        validated.project_id || null,
        req.user!.id,
        validated.title,
        validated.meeting_date,
        validated.attendees || [],
        validated.raw_notes,
        analysis.summary
      ]
    );

    const newMeeting = meetRes.rows[0];

    // Insert AI-extracted action items
    const createdActionItems: any[] = [];
    if (analysis.action_items && analysis.action_items.length > 0) {
      for (const item of analysis.action_items) {
        const itemRes = await db.query(
          `INSERT INTO meeting_action_items (
            organization_id, meeting_id, title, description, assignee_name, deadline, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
          RETURNING *`,
          [orgId, newMeeting.id, item.title, item.description, item.owner || null, item.deadline || null]
        );
        createdActionItems.push(itemRes.rows[0]);
      }
    }

    newMeeting.action_items = createdActionItems;
    newMeeting.decisions = analysis.decisions;
    newMeeting.risks = analysis.risks;
    newMeeting.follow_up_items = analysis.follow_up_items;

    await logActivity(orgId, req.user!.id, 'meeting.create', 'meeting', newMeeting.id, {
      title: newMeeting.title,
      action_items_count: createdActionItems.length
    });

    return res.status(201).json(newMeeting);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create meeting error:', error);
    return res.status(500).json({ error: 'Failed to process and record meeting notes' });
  }
});

// POST /api/meetings/:id/action-items/:itemId/convert-to-task
router.post('/:id/action-items/:itemId/convert-to-task', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id, itemId } = req.params;

    // Fetch action item
    const itemRes = await db.query(
      'SELECT * FROM meeting_action_items WHERE id = $1 AND meeting_id = $2 AND organization_id = $3',
      [itemId, id, orgId]
    );

    if (itemRes.rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    const item = itemRes.rows[0];

    // Fetch meeting details for department/project linkage
    const meetingRes = await db.query(
      'SELECT department_id, project_id FROM meetings WHERE id = $1 AND organization_id = $2',
      [id, orgId]
    );
    const meeting = meetingRes.rows[0];

    // Create the actual Task
    const taskRes = await db.query(
      `INSERT INTO tasks (
        organization_id, creator_id, title, description, project_id, department_id, priority, status, due_date, labels
      ) VALUES ($1, $2, $3, $4, $5, $6, 'high', 'todo', $7, $8)
      RETURNING *`,
      [
        orgId,
        req.user!.id,
        item.title,
        item.description || `Extracted from meeting action item. Assignee: ${item.assignee_name || 'Unassigned'}`,
        meeting?.project_id || null,
        meeting?.department_id || null,
        item.deadline || null,
        ['meeting-action-item']
      ]
    );

    const newTask = taskRes.rows[0];

    // Update the action item status and link task_id
    await db.query(
      `UPDATE meeting_action_items
       SET status = 'converted_to_task', task_id = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3`,
      [newTask.id, itemId, orgId]
    );

    await logActivity(orgId, req.user!.id, 'meeting.action_item_converted', 'task', newTask.id, {
      meeting_id: id,
      action_item_id: itemId,
      task_title: newTask.title
    });

    return res.json({
      message: 'Action item successfully converted into production task',
      task: newTask
    });
  } catch (error: any) {
    console.error('Convert action item error:', error);
    return res.status(500).json({ error: 'Failed to convert action item to task' });
  }
});

export default router;
