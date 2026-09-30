import bcrypt from 'bcryptjs';
import { db } from './index.js';

export async function seedDatabase() {
  await db.init();

  // Check if organizations already exist
  const existingOrgs = await db.query('SELECT count(*) as count FROM organizations');
  if (parseInt(existingOrgs.rows[0]?.count || '0', 10) > 0) {
    console.log('Database already contains data, skipping seed.');
    return;
  }

  console.log('Seeding enterprise database with production-grade initial dataset...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Organization
  const orgResult = await db.query(
    `INSERT INTO organizations (name, slug, domain, plan)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['Apex Global Enterprises', 'apex-global', 'apexglobal.com', 'enterprise']
  );
  const orgId = orgResult.rows[0].id;

  // 2. Create Users
  const usersData = [
    { email: 'sarah.chen@apexglobal.com', firstName: 'Sarah', lastName: 'Chen', title: 'VP of Engineering', role: 'organization_admin' },
    { email: 'marcus.vance@apexglobal.com', firstName: 'Marcus', lastName: 'Vance', title: 'Product Director', role: 'manager' },
    { email: 'elena.rostova@apexglobal.com', firstName: 'Elena', lastName: 'Rostova', title: 'Staff Frontend Architect', role: 'employee' },
    { email: 'david.kim@apexglobal.com', firstName: 'David', lastName: 'Kim', title: 'Principal DevOps Lead', role: 'employee' },
    { email: 'priya.patel@apexglobal.com', firstName: 'Priya', lastName: 'Patel', title: 'VP of Global Marketing', role: 'department_admin' },
  ];

  const userIds: Record<string, string> = {};

  for (const u of usersData) {
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, title, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id`,
      [u.email, passwordHash, u.firstName, u.lastName, u.title]
    );
    userIds[u.email] = userRes.rows[0].id;
  }

  // 3. Create Departments
  const departmentsData = [
    { name: 'Engineering', code: 'ENG', description: 'Core platform development, cloud architecture, and cybersecurity', head: userIds['sarah.chen@apexglobal.com'] },
    { name: 'Product', code: 'PROD', description: 'Product roadmap, enterprise features, UX research, and specifications', head: userIds['marcus.vance@apexglobal.com'] },
    { name: 'Marketing', code: 'MKT', description: 'Global brand awareness, growth marketing, enterprise sales enablement', head: userIds['priya.patel@apexglobal.com'] },
    { name: 'Operations', code: 'OPS', description: 'IT operations, vendor management, internal workflows, and facilities', head: userIds['david.kim@apexglobal.com'] },
    { name: 'Finance', code: 'FIN', description: 'Financial forecasting, budgets, payroll, audit compliance, and accounting', head: null },
    { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, organizational culture, people operations, and training', head: null },
    { name: 'Customer Support', code: 'CS', description: 'Tier 1-3 customer technical success and enterprise SLA management', head: null },
    { name: 'Legal & Compliance', code: 'LEGAL', description: 'Regulatory compliance, SOC2/GDPR, contracts, and IP protection', head: null }
  ];

  const deptIds: Record<string, string> = {};

  for (const dept of departmentsData) {
    const deptRes = await db.query(
      `INSERT INTO departments (organization_id, name, code, description, head_user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [orgId, dept.name, dept.code, dept.description, dept.head]
    );
    deptIds[dept.code] = deptRes.rows[0].id;
  }

  // 4. Organization Members
  for (const u of usersData) {
    let deptId = deptIds['ENG'];
    if (u.email.includes('marcus')) deptId = deptIds['PROD'];
    if (u.email.includes('priya')) deptId = deptIds['MKT'];

    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, department_id, role)
       VALUES ($1, $2, $3, $4)`,
      [orgId, userIds[u.email], deptId, u.role]
    );
  }

  // 5. Projects
  const projectsData = [
    {
      name: 'NextGen Cloud Migration',
      code: 'ENG',
      desc: 'Migrating legacy on-prem and multi-cloud services to unified AWS multi-region infrastructure with Kubernetes.',
      owner: userIds['sarah.chen@apexglobal.com'],
      status: 'active',
      start: '2025-01-10',
      target: '2025-11-30'
    },
    {
      name: 'SOC 2 Type II Compliance Audit',
      code: 'OPS',
      desc: 'Annual enterprise security compliance audit, penetration test remediations, and vendor security review.',
      owner: userIds['david.kim@apexglobal.com'],
      status: 'active',
      start: '2025-02-01',
      target: '2025-10-15'
    },
    {
      name: 'Q4 Global Brand Refresh & Website Launch',
      code: 'MKT',
      desc: 'Comprehensive redesign of enterprise digital assets, customer portal rebrand, and global ad campaigns.',
      owner: userIds['priya.patel@apexglobal.com'],
      status: 'active',
      start: '2025-03-01',
      target: '2025-12-01'
    },
    {
      name: 'AI Operations & Auto-Triage Platform',
      code: 'PROD',
      desc: 'Autonomous enterprise ticket triage and customer intelligence agent integrating LLMs.',
      owner: userIds['marcus.vance@apexglobal.com'],
      status: 'planning',
      start: '2025-04-15',
      target: '2026-01-30'
    }
  ];

  const projectIds: Record<string, string> = {};

  for (const p of projectsData) {
    const projRes = await db.query(
      `INSERT INTO projects (organization_id, department_id, name, description, owner_id, status, start_date, target_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [orgId, deptIds[p.code], p.name, p.desc, p.owner, p.status, p.start, p.target]
    );
    projectIds[p.name] = projRes.rows[0].id;
  }

  // 6. Tasks
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);
  const pastDateStr = pastDate.toISOString().split('T')[0];

  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 4);
  const futureDate1Str = futureDate1.toISOString().split('T')[0];

  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 14);
  const futureDate2Str = futureDate2.toISOString().split('T')[0];

  const tasksData = [
    {
      title: 'Deploy Automated Database Backup Verification & Restore Drill',
      desc: 'Set up cron job and health checks to test restoring daily database snapshots in an isolated sandbox.',
      proj: projectIds['NextGen Cloud Migration'],
      dept: deptIds['ENG'],
      creator: userIds['sarah.chen@apexglobal.com'],
      assignee: userIds['david.kim@apexglobal.com'],
      status: 'todo',
      priority: 'critical',
      dueDate: pastDateStr, // overdue
      labels: ['infrastructure', 'devops', 'compliance']
    },
    {
      title: 'Migrate Core Services to EKS v1.28 & Update Terraform Modules',
      desc: 'Upgrade all production kubernetes worker node groups to AWS EKS v1.28 with zero-downtime rolling updates.',
      proj: projectIds['NextGen Cloud Migration'],
      dept: deptIds['ENG'],
      creator: userIds['sarah.chen@apexglobal.com'],
      assignee: userIds['david.kim@apexglobal.com'],
      status: 'in_progress',
      priority: 'high',
      dueDate: futureDate1Str,
      labels: ['kubernetes', 'cloud', 'aws']
    },
    {
      title: 'Conduct External Penetration Testing & Fix Vulnerabilities',
      desc: 'Collaborate with external red team auditor, patch SSL cipher configurations, and remediate CVEs.',
      proj: projectIds['SOC 2 Type II Compliance Audit'],
      dept: deptIds['ENG'],
      creator: userIds['sarah.chen@apexglobal.com'],
      assignee: userIds['elena.rostova@apexglobal.com'],
      status: 'blocked',
      priority: 'critical',
      dueDate: futureDate1Str,
      labels: ['security', 'audit', 'soc2']
    },
    {
      title: 'Finalize Marketing Design System and Rebrand Guidelines',
      desc: 'Deliver vector typography kits, color palettes, and component library specs for web and print.',
      proj: projectIds['Q4 Global Brand Refresh & Website Launch'],
      dept: deptIds['MKT'],
      creator: userIds['priya.patel@apexglobal.com'],
      assignee: userIds['priya.patel@apexglobal.com'],
      status: 'in_progress',
      priority: 'high',
      dueDate: futureDate2Str,
      labels: ['design', 'brand', 'ui']
    },
    {
      title: 'Audit Third-Party Vendor Data Processing Agreements (GDPR)',
      desc: 'Review legal terms with top 20 SaaS suppliers regarding GDPR chapter 3 data transfers and encryption standards.',
      proj: projectIds['SOC 2 Type II Compliance Audit'],
      dept: deptIds['OPS'],
      creator: userIds['sarah.chen@apexglobal.com'],
      assignee: userIds['marcus.vance@apexglobal.com'],
      status: 'completed',
      priority: 'medium',
      dueDate: pastDateStr,
      labels: ['legal', 'gdpr', 'vendor']
    }
  ];

  const taskIds: Record<string, string> = {};

  for (const t of tasksData) {
    const tRes = await db.query(
      `INSERT INTO tasks (organization_id, project_id, department_id, creator_id, assignee_id, title, description, status, priority, due_date, labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [orgId, t.proj, t.dept, t.creator, t.assignee, t.title, t.desc, t.status, t.priority, t.dueDate, t.labels]
    );
    taskIds[t.title] = tRes.rows[0].id;
  }

  // 7. Task Dependencies
  if (taskIds['Conduct External Penetration Testing & Fix Vulnerabilities'] && taskIds['Migrate Core Services to EKS v1.28 & Update Terraform Modules']) {
    await db.query(
      `INSERT INTO task_dependencies (organization_id, task_id, depends_on_task_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [orgId, taskIds['Conduct External Penetration Testing & Fix Vulnerabilities'], taskIds['Migrate Core Services to EKS v1.28 & Update Terraform Modules']]
    );
  }

  // 8. Documents
  const documentsData = [
    {
      title: 'Enterprise Cloud Infrastructure Architecture & Security SOP',
      category: 'SOP',
      dept: deptIds['ENG'],
      proj: projectIds['NextGen Cloud Migration'],
      author: userIds['sarah.chen@apexglobal.com'],
      visibility: 'organization',
      content: `Standard Operating Procedure: Enterprise Multi-Region Cloud Architecture

1. Purpose & Scope:
This SOP defines the operational criteria for deploying, scaling, and maintaining zero-trust cloud workloads across AWS regions us-east-1 and eu-central-1.

2. Access & Authentication:
All engineering personnel must authenticate using Hardware MFA keys (FIDO2) through Okta SSO. Direct SSH to EC2 instances is strictly disabled; AWS Systems Manager Session Manager with session auditing must be utilized.

3. Secrets Management:
No credentials or API keys may be committed into Git repositories. All microservices must pull dynamically rotated secrets from AWS Secrets Manager or Vault at startup with IAM roles for service accounts (IRSA).

4. Deployment Pipeline:
All production deployments require 2 senior peer reviews, automated unit test coverage >= 85%, automated SAST security scan pass, and canary traffic analysis before 100% traffic shift.`,
      summary: 'Comprehensive SOP detailing zero-trust cloud security, MFA requirements, Secrets Manager integration, and canary deployment gates.'
    },
    {
      title: 'Incident Response & Disaster Recovery Playbook',
      category: 'Policy',
      dept: deptIds['OPS'],
      proj: projectIds['SOC 2 Type II Compliance Audit'],
      author: userIds['david.kim@apexglobal.com'],
      visibility: 'organization',
      content: `Enterprise Disaster Recovery & Security Incident Response Plan

1. Incident Classification:
- SEV-1 (Critical): Complete platform outage or confirmed data breach. Escalation within 5 minutes.
- SEV-2 (High): Major service degradation affecting >10% enterprise customers. Escalation within 15 minutes.
- SEV-3 (Moderate): Non-critical component error or localized glitch. Escalation within 1 hour.

2. Incident Commander Responsibilities:
The on-call Incident Commander assumes complete operational command, establishes the War Room bridge, assigns a dedicated Communications Officer, and coordinates remediation steps with Engineering Leads.

3. Backup Recovery Targets:
- Recovery Point Objective (RPO): < 15 minutes for transactional databases.
- Recovery Time Objective (RTO): < 60 minutes for core platform services.`,
      summary: 'Outlines SEV 1-3 classification, Incident Commander protocols, RPO (15 min), and RTO (60 min) benchmarks.'
    },
    {
      title: 'Q3 Financial Performance & Strategic Runway Analysis',
      category: 'Report',
      dept: deptIds['FIN'],
      proj: null,
      author: userIds['sarah.chen@apexglobal.com'],
      visibility: 'organization',
      content: `Executive Summary: Q3 Financial Results

Annual Recurring Revenue (ARR) grew 34% Year-over-Year to $48.2M, driven by strong enterprise tier expansion. Gross margins expanded to 79.4%, reflecting improved infrastructure efficiency from the Kubernetes modernization initiative.

Operating Expenses:
- Research & Development: 42% ($5.1M)
- Sales & Marketing: 33% ($4.0M)
- General & Administrative: 25% ($3.0M)

Runway & Cash Reserves:
Current liquid cash reserves stand at $32.4M, representing 28 months of net operational runway under current spending assumptions.`,
      summary: 'Q3 ARR grew 34% YoY to $48.2M with 79.4% gross margins. 28 months of net operational runway remains intact.'
    }
  ];

  for (const doc of documentsData) {
    await db.query(
      `INSERT INTO documents (organization_id, department_id, project_id, author_id, title, content, category, visibility, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [orgId, doc.dept, doc.proj, doc.author, doc.title, doc.content, doc.category, doc.visibility, doc.summary]
    );
  }

  // 9. Meetings & Action Items
  const meetingDate = new Date();
  meetingDate.setDate(meetingDate.getDate() - 1);

  const meetRes = await db.query(
    `INSERT INTO meetings (organization_id, department_id, project_id, organizer_id, title, meeting_date, attendees, raw_notes, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      orgId,
      deptIds['ENG'],
      projectIds['NextGen Cloud Migration'],
      userIds['sarah.chen@apexglobal.com'],
      'Weekly Architecture & Infrastructure Alignment Sync',
      meetingDate.toISOString(),
      ['Sarah Chen', 'David Kim', 'Elena Rostova', 'Marcus Vance'],
      `Agenda:
1. Status of Kubernetes EKS v1.28 migration
2. Database backup verification failures and latency spike
3. SOC 2 third-party pentest timeline

Discussion:
David noted that while 4 worker nodes have been upgraded cleanly, the automated daily database restore test failed due to an IAM role timeout. Sarah emphasized this is a critical audit blocker that must be fixed by tomorrow.
Elena reported that frontend build optimization reduced load times by 28%.
Marcus requested staging environment access for the new AI triage customer support agent testing.

Decisions:
1. David is prioritized 100% on the backup restoration drill until it passes reliably.
2. SOC 2 penetration test window confirmed for the 15th.
3. Marcus will receive dedicated sandbox credentials by Wednesday.`,
      'Key architectural alignment meeting prioritizing database backup drill resolution, confirming SOC2 penetration test window, and approving AI triage platform staging access.'
    ]
  );
  const meetingId = meetRes.rows[0].id;

  // Add Action Items
  await db.query(
    `INSERT INTO meeting_action_items (organization_id, meeting_id, title, description, assignee_name, deadline, status)
     VALUES 
     ($1, $2, 'Resolve IAM role timeout on automated DB restore job', 'Update IAM policy on the backup verification lambda and run test restore', 'David Kim', $3, 'pending'),
     ($1, $2, 'Provision AI triage staging environment credentials', 'Create IAM role and provide OAuth credentials for Marcus Vance', 'David Kim', $4, 'pending')`,
    [orgId, meetingId, futureDate1Str, futureDate2Str]
  );

  // 10. AI Insights
  const insightsData = [
    {
      title: 'Critical Database Backup Verification Task is Overdue',
      desc: 'Task "Deploy Automated Database Backup Verification & Restore Drill" is currently 3 days past due date with critical severity. This constitutes an immediate SOC 2 compliance failure risk.',
      severity: 'critical',
      category: 'deadline',
      evidence: [
        'Task due date was 3 days ago',
        'Task priority is Critical',
        'Assigned to David Kim who has 3 other high priority tickets'
      ],
      actions: [
        'Reassign non-critical DevOps tasks from David Kim',
        'Escalate to VP of Engineering for immediate sign-off',
        'Trigger automated restore script in staging environment today'
      ],
      records: [{ type: 'task', id: taskIds['Deploy Automated Database Backup Verification & Restore Drill'] }]
    },
    {
      title: 'Cross-Department Blocker on Security Penetration Testing',
      desc: 'Penetration testing task is blocked awaiting completion of EKS v1.28 migration, threatening the SOC 2 compliance deadline.',
      severity: 'high',
      category: 'dependency',
      evidence: [
        'Task dependency recorded in task_dependencies table',
        'Both tasks are on critical path for SOC 2 project'
      ],
      actions: [
        'Allocate additional DevOps pairing support to complete EKS migration',
        'Notify external penetration test auditors of potential 48-hour schedule shift'
      ],
      records: [{ type: 'task', id: taskIds['Conduct External Penetration Testing & Fix Vulnerabilities'] }]
    },
    {
      title: 'DevOps Workload Concentration Bottleneck',
      desc: 'David Kim holds 68% of critical infrastructure and compliance action items, creating a single-point-of-failure risk.',
      severity: 'medium',
      category: 'workload',
      evidence: [
        'Assigned to 2 critical tasks, 2 active meeting action items, and 1 high priority migration'
      ],
      actions: [
        'Delegate IAM policy reviews to secondary security engineer',
        'Spread upcoming Q4 maintenance tickets across team'
      ],
      records: [{ type: 'department', id: deptIds['ENG'] }]
    }
  ];

  for (const ins of insightsData) {
    await db.query(
      `INSERT INTO ai_insights (organization_id, title, description, severity, category, evidence, recommended_actions, related_records)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [orgId, ins.title, ins.desc, ins.severity, ins.category, JSON.stringify(ins.evidence), JSON.stringify(ins.actions), JSON.stringify(ins.records)]
    );
  }

  // 11. Initial Activity Logs
  const sampleActivities = [
    { action: 'user.login', entity_type: 'user', entity_id: userIds['sarah.chen@apexglobal.com'], user_id: userIds['sarah.chen@apexglobal.com'], details: { ip: '10.0.4.12', client: 'Enterprise SSO' } },
    { action: 'task.create', entity_type: 'task', entity_id: taskIds['Deploy Automated Database Backup Verification & Restore Drill'], user_id: userIds['sarah.chen@apexglobal.com'], details: { priority: 'critical', title: 'Deploy Automated Database Backup Verification' } },
    { action: 'document.create', entity_type: 'document', entity_id: null, user_id: userIds['sarah.chen@apexglobal.com'], details: { title: 'Enterprise Cloud Infrastructure Architecture & Security SOP' } },
    { action: 'meeting.create', entity_type: 'meeting', entity_id: meetingId, user_id: userIds['sarah.chen@apexglobal.com'], details: { title: 'Weekly Architecture & Infrastructure Alignment Sync' } },
    { action: 'ai.insights_generated', entity_type: 'ai_insights', entity_id: null, user_id: userIds['sarah.chen@apexglobal.com'], details: { count: 3, categories: ['deadline', 'dependency', 'workload'] } },
  ];

  for (const act of sampleActivities) {
    await db.query(
      `INSERT INTO activity_logs (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, act.user_id, act.action, act.entity_type, act.entity_id, JSON.stringify(act.details)]
    );
  }

  console.log('Enterprise database seeded successfully!');
  console.log('Demo Login Credentials:');
  console.log('Admin Email: sarah.chen@apexglobal.com | Password: Password123!');
  console.log('Manager Email: marcus.vance@apexglobal.com | Password: Password123!');
  console.log('Employee Email: elena.rostova@apexglobal.com | Password: Password123!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
