import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiService } from '../services/ai/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// POST /api/ai/chat
router.post('/chat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { query, conversation_id } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text is required' });
    }

    // Retrieve authorized organizational context for RAG
    const tasksRes = await db.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, d.name as department_name, u.first_name || ' ' || u.last_name as assignee_name
       FROM tasks t
       LEFT JOIN departments d ON d.id = t.department_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.organization_id = $1 LIMIT 50`,
      [orgId]
    );

    const projectsRes = await db.query(
      `SELECT p.id, p.name, p.status, d.name as department_name
       FROM projects p
       LEFT JOIN departments d ON d.id = p.department_id
       WHERE p.organization_id = $1 LIMIT 20`,
      [orgId]
    );

    const docsRes = await db.query(
      `SELECT id, title, category, summary FROM documents WHERE organization_id = $1 LIMIT 20`,
      [orgId]
    );

    const meetingsRes = await db.query(
      `SELECT id, title, summary, meeting_date FROM meetings WHERE organization_id = $1 ORDER BY meeting_date DESC LIMIT 10`,
      [orgId]
    );

    const deptsRes = await db.query(
      `SELECT id, name, code FROM departments WHERE organization_id = $1`,
      [orgId]
    );

    const context = {
      tasks: tasksRes.rows,
      projects: projectsRes.rows,
      documents: docsRes.rows,
      meetings: meetingsRes.rows,
      departments: deptsRes.rows,
    };

    const response = await aiService.chat(query, context);

    // Save conversation history if conversation_id provided or create new
    let convId = conversation_id;
    if (!convId) {
      const convRes = await db.query(
        `INSERT INTO ai_conversations (organization_id, user_id, title)
         VALUES ($1, $2, $3) RETURNING id`,
        [orgId, req.user!.id, query.slice(0, 50)]
      );
      convId = convRes.rows[0].id;
    }

    // Save user message
    await db.query(
      `INSERT INTO ai_messages (organization_id, conversation_id, role, content)
       VALUES ($1, $2, 'user', $3)`,
      [orgId, convId, query]
    );

    // Save assistant message
    await db.query(
      `INSERT INTO ai_messages (organization_id, conversation_id, role, content, structured_data)
       VALUES ($1, $2, 'assistant', $3, $4)`,
      [orgId, convId, response.answer, JSON.stringify(response)]
    );

    await logActivity(orgId, req.user!.id, 'ai.chat', 'ai_conversation', convId, {
      query: query.slice(0, 100),
      sources_count: response.sources.length
    });

    return res.json({
      conversation_id: convId,
      ...response
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: 'AI Assistant failed to process query' });
  }
});

// POST /api/ai/summarize
router.post('/summarize', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Document content is required for summarization' });
    }

    const summary = await aiService.summarizeDocument(title || 'Document', content, category || 'Knowledge Article');

    await logActivity(req.user!.organization_id, req.user!.id, 'ai.summarize', 'document', null, {
      title
    });

    return res.json(summary);
  } catch (error: any) {
    console.error('AI summarize error:', error);
    return res.status(500).json({ error: 'Failed to generate document summary' });
  }
});

// POST /api/ai/generate-tasks
router.post('/generate-tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { input_text } = req.body;

    if (!input_text || typeof input_text !== 'string') {
      return res.status(400).json({ error: 'Input text is required for task generation' });
    }

    const deptsRes = await db.query(
      'SELECT id, name FROM departments WHERE organization_id = $1',
      [orgId]
    );

    const generated = await aiService.generateTasksFromText(input_text, deptsRes.rows);

    await logActivity(orgId, req.user!.id, 'ai.generate_tasks', 'tasks', null, {
      task_count: generated.tasks.length
    });

    return res.json(generated);
  } catch (error: any) {
    console.error('AI generate tasks error:', error);
    return res.status(500).json({ error: 'Failed to generate structured tasks' });
  }
});

// POST /api/ai/analyze-meeting
router.post('/analyze-meeting', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { notes, title } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Meeting notes are required' });
    }

    const result = await aiService.analyzeMeeting(notes, title || 'Meeting');
    return res.json(result);
  } catch (error: any) {
    console.error('AI meeting analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze meeting notes' });
  }
});

// POST /api/ai/generate-insights
router.post('/generate-insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const tasksRes = await db.query(
      `SELECT t.*, d.name as department_name, u.first_name || ' ' || u.last_name as assignee_name
       FROM tasks t
       LEFT JOIN departments d ON d.id = t.department_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.organization_id = $1`,
      [orgId]
    );

    const projectsRes = await db.query(
      `SELECT * FROM projects WHERE organization_id = $1`,
      [orgId]
    );

    const deptsRes = await db.query(
      `SELECT * FROM departments WHERE organization_id = $1`,
      [orgId]
    );

    const result = await aiService.generateOperationalInsights({
      tasks: tasksRes.rows,
      projects: projectsRes.rows,
      departments: deptsRes.rows
    });

    // Store new insights in database
    for (const ins of result.insights) {
      await db.query(
        `INSERT INTO ai_insights (
          organization_id, title, description, severity, category, evidence, recommended_actions, related_records
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orgId,
          ins.title,
          ins.description,
          ins.severity,
          ins.category,
          JSON.stringify(ins.evidence),
          JSON.stringify(ins.recommended_actions),
          JSON.stringify(ins.related_records)
        ]
      );
    }

    await logActivity(orgId, req.user!.id, 'ai.generate_insights', 'ai_insights', null, {
      insights_count: result.insights.length
    });

    return res.json(result);
  } catch (error: any) {
    console.error('AI generate insights error:', error);
    return res.status(500).json({ error: 'Failed to generate operational insights' });
  }
});

// POST /api/ai/generate-report
router.post('/generate-report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { title } = req.body;

    const tasksRes = await db.query('SELECT * FROM tasks WHERE organization_id = $1', [orgId]);
    const projectsRes = await db.query('SELECT * FROM projects WHERE organization_id = $1', [orgId]);
    const deptsRes = await db.query('SELECT * FROM departments WHERE organization_id = $1', [orgId]);

    const reportData = await aiService.generateExecutiveReport({
      orgName: req.user!.organization_name,
      tasks: tasksRes.rows,
      projects: projectsRes.rows,
      departments: deptsRes.rows
    });

    // Save report to database
    const reportTitle = title || `Executive Operations Briefing - ${new Date().toLocaleDateString()}`;
    const reportRes = await db.query(
      `INSERT INTO reports (
        organization_id, creator_id, title, report_type, executive_summary, key_metrics,
        achievements, risks, bottlenecks, upcoming_priorities, recommended_actions
      ) VALUES ($1, $2, $3, 'executive', $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        orgId,
        req.user!.id,
        reportTitle,
        reportData.executive_summary,
        JSON.stringify(reportData.key_metrics),
        JSON.stringify(reportData.achievements),
        JSON.stringify(reportData.risks),
        JSON.stringify(reportData.bottlenecks),
        JSON.stringify(reportData.upcoming_priorities),
        JSON.stringify(reportData.recommended_actions)
      ]
    );

    const savedReport = reportRes.rows[0];

    await logActivity(orgId, req.user!.id, 'report.create', 'report', savedReport.id, {
      title: reportTitle
    });

    return res.status(201).json(savedReport);
  } catch (error: any) {
    console.error('AI generate report error:', error);
    return res.status(500).json({ error: 'Failed to generate executive report' });
  }
});

// POST /api/ai/analyze-task
router.post('/analyze-task', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { query } = req.body;
    const task_id = req.body.task_id || req.body.taskId;

    if (!task_id) {
      return res.status(400).json({ error: 'task_id is required' });
    }

    // Retrieve task with full metadata
    const taskRes = await db.query(
      `SELECT t.*, d.name as department_name, p.name as project_name, 
              u.first_name || ' ' || u.last_name as assignee_name
       FROM tasks t
       LEFT JOIN departments d ON d.id = t.department_id
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.id = $1 AND t.organization_id = $2`,
      [task_id, orgId]
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    const task = taskRes.rows[0];

    // Retrieve task dependencies
    const depRes = await db.query(
      `SELECT pt.title as prerequisite_title, pt.status as prerequisite_status
       FROM task_dependencies td
       JOIN tasks pt ON pt.id = td.depends_on_task_id
       WHERE td.task_id = $1`,
      [task_id]
    );

    const analysis = await aiService.analyzeTask(task, depRes.rows, query);

    await logActivity(orgId, req.user!.id, 'task.ai_analyzed', 'task', task.id, {
      task_title: task.title,
      feasibility_score: analysis.feasibility_score
    });

    return res.json(analysis);
  } catch (error: any) {
    console.error('AI analyze task error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze task with AI' });
  }
});

export default router;
