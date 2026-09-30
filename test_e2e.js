// Comprehensive End-to-End Verification Test Script
// Verifies all required features from Sections 4, 11, 12, 15, and 22

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING ENTERPRISE AI FULL E2E SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('--- 1. Testing System Health ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'healthy', 'System health check is online');

  // 2. Authentication: Login
  console.log('\n--- 2. Testing Authentication & RBAC ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah.chen@apexglobal.com', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.token, 'Login successful with JWT session token');
  assert(loginData.user.role === 'organization_admin', 'Role-based identity resolved to organization_admin');

  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 3. User Session Verification
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.email === 'sarah.chen@apexglobal.com', 'Session token verification authenticated correctly');

  // 4. Personalized Dashboard
  console.log('\n--- 3. Testing Personalized Enterprise Dashboard ---');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
  const dashData = await dashRes.json();
  assert(dashRes.status === 200, 'Dashboard API returned 200 OK');
  assert(dashData.metrics.active_projects >= 1, `Dashboard metrics: ${dashData.metrics.active_projects} active projects`);
  assert(dashData.active_projects.length > 0, `Active projects array populated with ${dashData.active_projects.length} project(s)`);
  assert(dashData.ai_insights.length > 0, `Live AI Insights loaded (${dashData.ai_insights.length} active insights)`);

  // 5. Intelligent Task Management
  console.log('\n--- 4. Testing Intelligent Task Management ---');
  const tasksRes = await fetch(`${BASE_URL}/tasks`, { headers: authHeaders });
  const tasksData = await tasksRes.json();
  assert(tasksRes.status === 200 && Array.isArray(tasksData), `Retrieved ${tasksData.length} organizational tasks`);

  // Create Task
  const newTaskRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Automated E2E Verification Task',
      description: 'Verifying automated platform task lifecycle and dependencies.',
      priority: 'high',
      status: 'in_progress',
      labels: ['testing', 'automation']
    }),
  });
  const newTask = await newTaskRes.json();
  assert(newTaskRes.status === 201 && newTask.id, `Created task "${newTask.title}" with UUID ${newTask.id}`);

  // Update Task Status
  const updateTaskRes = await fetch(`${BASE_URL}/tasks/${newTask.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'completed' }),
  });
  const updatedTask = await updateTaskRes.json();
  assert(updatedTask.status === 'completed', 'Task status transition to completed successful');

  // 6. Strategic Projects Management
  console.log('\n--- 5. Testing Project Management ---');
  const projsRes = await fetch(`${BASE_URL}/projects`, { headers: authHeaders });
  const projsData = await projsRes.json();
  assert(projsRes.status === 200 && projsData.length > 0, `Retrieved ${projsData.length} strategic projects`);
  assert(projsData[0].progress_percentage !== undefined, `Calculated project deliverable progress: ${projsData[0].progress_percentage}%`);

  // 7. Departments Hub
  console.log('\n--- 6. Testing Department Management ---');
  const deptsRes = await fetch(`${BASE_URL}/departments`, { headers: authHeaders });
  const deptsData = await deptsRes.json();
  assert(deptsRes.status === 200 && deptsData.length >= 8, `Found ${deptsData.length} enterprise departments`);

  // 8. Document & Knowledge Management with AI Summarization
  console.log('\n--- 7. Testing Document & Knowledge Base ---');
  const docsRes = await fetch(`${BASE_URL}/documents`, { headers: authHeaders });
  const docsData = await docsRes.json();
  assert(docsRes.status === 200 && docsData.length > 0, `Retrieved ${docsData.length} enterprise SOPs and policies`);

  // Test AI Document Summarization (Section 15.2)
  console.log('\n--- 8. Testing AI Document Summarization ---');
  const summarizeRes = await fetch(`${BASE_URL}/ai/summarize`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: docsData[0].title,
      content: docsData[0].content,
      category: docsData[0].category,
    }),
  });
  const summaryData = await summarizeRes.json();
  assert(summarizeRes.status === 200 && summaryData.summary, 'AI Document Summarization returned valid executive summary');
  assert(Array.isArray(summaryData.key_points) && summaryData.key_points.length > 0, 'AI generated structured key points array');
  assert(Array.isArray(summaryData.action_items), 'AI extracted structured action items');

  // 9. Meeting Intelligence & 1-Click Action Item to Task Conversion (Section 4.11)
  console.log('\n--- 9. Testing Meeting Intelligence & Action Item Conversion ---');
  const meetingsRes = await fetch(`${BASE_URL}/meetings`, { headers: authHeaders });
  const meetingsData = await meetingsRes.json();
  assert(meetingsRes.status === 200 && meetingsData.length > 0, `Retrieved ${meetingsData.length} recorded meetings`);

  const firstMeeting = await (await fetch(`${BASE_URL}/meetings/${meetingsData[0].id}`, { headers: authHeaders })).json();
  assert(firstMeeting.action_items && firstMeeting.action_items.length > 0, `Meeting has ${firstMeeting.action_items.length} extracted action items`);

  // Convert action item to task
  const actionItem = firstMeeting.action_items.find(i => i.status === 'pending') || firstMeeting.action_items[0];
  const convertRes = await fetch(`${BASE_URL}/meetings/${firstMeeting.id}/action-items/${actionItem.id}/convert-to-task`, {
    method: 'POST',
    headers: authHeaders,
  });
  const convertData = await convertRes.json();
  assert(convertRes.status === 200 && convertData.task?.id, 'Action item converted to production task successfully');

  // 10. AI Assistant RAG Chat (Section 15.1)
  console.log('\n--- 10. Testing AI Assistant RAG Chat ---');
  const chatRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ query: 'What are the pending tasks for the marketing department?' }),
  });
  const chatData = await chatRes.json();
  assert(chatRes.status === 200 && chatData.answer, 'AI Assistant processed query and returned direct answer');
  assert(Array.isArray(chatData.key_points), 'AI Assistant provided key points');
  assert(Array.isArray(chatData.sources), `AI Assistant cited ${chatData.sources.length} internal source(s)`);
  assert(Array.isArray(chatData.follow_up_questions), 'AI Assistant provided follow-up recommendations');

  // 11. AI Task Generation from Unstructured Text (Section 4.6 & Section 15.3)
  console.log('\n--- 11. Testing AI Task Generation ---');
  const genTaskRes = await fetch(`${BASE_URL}/ai/generate-tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      input_text: 'We need to launch the new website next month. Marketing should prepare the campaign, engineering should complete deployment, and finance should approve the budget.'
    }),
  });
  const genTaskData = await genTaskRes.json();
  assert(genTaskRes.status === 200 && Array.isArray(genTaskData.tasks), `AI decomposed input into ${genTaskData.tasks.length} structured task(s)`);
  assert(genTaskData.tasks[0]?.priority, 'AI assigned priority to decomposed tasks');
  assert(genTaskData.tasks[0]?.reasoning, 'AI supplied explainable reasoning for generated task');

  // 12. AI Operational Insights (Section 4.12 & Section 15.5)
  console.log('\n--- 12. Testing AI Operational Insights & Bottleneck Detection ---');
  const insightsRes = await fetch(`${BASE_URL}/insights`, { headers: authHeaders });
  const insightsData = await insightsRes.json();
  assert(insightsRes.status === 200 && insightsData.length > 0, `Active AI operational insights found: ${insightsData.length}`);
  assert(insightsData[0].evidence && Array.isArray(insightsData[0].evidence), 'Insights include supporting evidence data');
  assert(insightsData[0].recommended_actions && Array.isArray(insightsData[0].recommended_actions), 'Insights include recommended actions');

  // 13. AI Executive Reporting (Section 4.13 & Section 15.6)
  console.log('\n--- 13. Testing AI Executive Reporting ---');
  const reportRes = await fetch(`${BASE_URL}/ai/generate-report`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'Autonomous E2E Operations Briefing' }),
  });
  const reportData = await reportRes.json();
  assert(reportRes.status === 201 && reportData.id, `Executive briefing generated and persisted with UUID ${reportData.id}`);
  assert(reportData.executive_summary, 'Executive summary content generated');
  assert(Array.isArray(reportData.key_metrics) || typeof reportData.key_metrics === 'object', 'Report key metrics compiled');

  // 14. Global Natural-Language Search (Section 4.4)
  console.log('\n--- 14. Testing Enterprise Search ---');
  const searchRes = await fetch(`${BASE_URL}/search?query=cloud`, { headers: authHeaders });
  const searchData = await searchRes.json();
  assert(searchRes.status === 200 && Array.isArray(searchData), `Search returned ${searchData.length} relevant record(s) across departments`);

  // 15. Audit Logs (Section 4.14)
  console.log('\n--- 15. Testing Activity & Audit Logs ---');
  const activityRes = await fetch(`${BASE_URL}/activity`, { headers: authHeaders });
  const activityData = await activityRes.json();
  assert(activityRes.status === 200 && activityData.length > 0, `Audit log captured ${activityData.length} immutable events`);

  // Cleanup test task
  await fetch(`${BASE_URL}/tasks/${newTask.id}`, { method: 'DELETE', headers: authHeaders });

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
