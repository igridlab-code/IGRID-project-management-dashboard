const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDb();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. GET ALL PROJECTS
app.get('/api/projects', (req, res) => {
  const { domain, status, tag, search, sort, priority } = req.query;
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (domain && domain !== 'All') {
    sql += ' AND domain = ?';
    params.push(domain);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (priority && priority !== 'All') {
    sql += ' AND priority = ?';
    params.push(priority);
  }

  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }

  if (search) {
    sql += ' AND (title LIKE ? OR project_code LIKE ? OR description LIKE ? OR tags LIKE ? OR team_name LIKE ? OR team_lead LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }

  // Sorting
  if (sort === 'due_date') {
    sql += ' ORDER BY due_date ASC';
  } else if (sort === 'priority') {
    sql += ` ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Normal' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END ASC`;
  } else if (sort === 'progress') {
    sql += ' ORDER BY progress DESC';
  } else if (sort === 'project_code') {
    sql += ' ORDER BY project_code ASC';
  } else {
    sql += ' ORDER BY updated_at DESC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const projects = rows.map(r => {
      let members = [];
      try {
        members = r.team_members ? JSON.parse(r.team_members) : [];
      } catch(e) {
        members = [];
      }
      return { ...r, team_members: members };
    });
    res.json(projects);
  });
});

// 2. GET SINGLE PROJECT WITH BOM & ACTIVITIES
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let members = [];
    try {
      members = project.team_members ? JSON.parse(project.team_members) : [];
    } catch(e) {
      members = [];
    }
    project.team_members = members;

    // Fetch BOM items
    db.all('SELECT * FROM bom_items WHERE project_code = ?', [project.project_code], (err, boms) => {
      if (err) return res.status(500).json({ error: err.message });
      project.boms = boms || [];

      // Fetch Activities
      db.all('SELECT * FROM activities WHERE project_id = ? ORDER BY created_at DESC', [id], (err, activities) => {
        if (err) return res.status(500).json({ error: err.message });
        project.activities = activities || [];
        res.json(project);
      });
    });
  });
});

// 3. CREATE PROJECT
app.post('/api/projects', (req, res) => {
  const {
    project_code, title, description, domain, tags, status, priority,
    progress, start_date, due_date, immediate_action, github_repo,
    youtube_url, linkedin_url, doc_url, image_url,
    bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables
  } = req.body;

  if (!title || !domain) {
    return res.status(400).json({ error: 'Title and Domain are required.' });
  }

  const code = project_code || `IGRID-${(domain || 'GEN').substring(0,3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
  const membersJson = typeof team_members === 'string' ? team_members : JSON.stringify(team_members || []);

  const sql = `
    INSERT INTO projects (
      project_code, title, description, domain, tags, status, priority,
      progress, start_date, due_date, immediate_action, github_repo,
      youtube_url, linkedin_url, doc_url, image_url,
      bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      code, title, description || '', domain, tags || '', status || 'in_queue', priority || 'Normal',
      Number(progress) || 0, start_date || '', due_date || '', immediate_action || '', github_repo || '',
      youtube_url || '', linkedin_url || '', doc_url || '', image_url || '',
      bom_status || 'Not Required', team_name || '', team_lead || '', team_lead_photo || '', membersJson, deliverables || ''
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, project_code: code, message: 'Project created successfully.' });
    }
  );
});

// 4. UPDATE PROJECT
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const {
    title, description, domain, tags, status, priority,
    progress, start_date, due_date, immediate_action, github_repo,
    youtube_url, linkedin_url, doc_url, image_url,
    bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables
  } = req.body;

  const membersJson = typeof team_members === 'string' ? team_members : JSON.stringify(team_members || []);

  const sql = `
    UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      domain = COALESCE(?, domain),
      tags = COALESCE(?, tags),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      progress = COALESCE(?, progress),
      start_date = COALESCE(?, start_date),
      due_date = COALESCE(?, due_date),
      immediate_action = COALESCE(?, immediate_action),
      github_repo = COALESCE(?, github_repo),
      youtube_url = COALESCE(?, youtube_url),
      linkedin_url = COALESCE(?, linkedin_url),
      doc_url = COALESCE(?, doc_url),
      image_url = COALESCE(?, image_url),
      bom_status = COALESCE(?, bom_status),
      team_name = COALESCE(?, team_name),
      team_lead = COALESCE(?, team_lead),
      team_lead_photo = COALESCE(?, team_lead_photo),
      team_members = COALESCE(?, team_members),
      deliverables = COALESCE(?, deliverables),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      title, description, domain, tags, status, priority,
      progress !== undefined ? Number(progress) : null,
      start_date, due_date, immediate_action, github_repo,
      youtube_url, linkedin_url, doc_url, image_url,
      bom_status, team_name, team_lead, team_lead_photo, membersJson, deliverables, id
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Project updated successfully.', changes: this.changes });
    }
  );
});

// 5. UPDATE PROJECT STATUS (DRAG-AND-DROP WORKFLOW)
app.put('/api/projects/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, progress } = req.body;

  if (!['in_queue', 'in_progress', 'testing', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  let newProgress = progress;
  if (newProgress === undefined || newProgress === null) {
    if (status === 'in_queue') newProgress = 15;
    else if (status === 'in_progress') newProgress = 50;
    else if (status === 'testing') newProgress = 85;
    else if (status === 'completed') newProgress = 100;
  }

  const sql = `
    UPDATE projects SET
      status = ?,
      progress = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [status, newProgress, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO activities (project_id, author, author_role, message, type) VALUES (?, ?, ?, ?, ?)',
      [id, 'Lab Admin', 'Coordinator', `Moved status to ${status.replace('_', ' ').toUpperCase()} (Progress: ${newProgress}%)`, 'status_change']
    );

    res.json({ message: 'Status updated', status, progress: newProgress });
  });
});

// 6. DELETE PROJECT
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project deleted', changes: this.changes });
  });
});

// 7. GET STUDENTS
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 8. ADD STUDENT
app.post('/api/students', (req, res) => {
  const { name, roll_no, email, department, year, role, skills, avatar_color, avatar_initials, photo_url } = req.body;
  if (!name || !roll_no) return res.status(400).json({ error: 'Name and Roll No are required.' });

  const initials = avatar_initials || name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const color = avatar_color || '#6366f1';

  const sql = `
    INSERT INTO students (name, roll_no, email, department, year, role, skills, avatar_color, avatar_initials, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [name, roll_no, email || '', department || '', year || '', role || 'Member', skills || '', color, initials, photo_url || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Student registered successfully' });
  });
});

// 9. GET BOM ITEMS
app.get('/api/bom', (req, res) => {
  const { status, project_code } = req.query;
  let sql = 'SELECT * FROM bom_items WHERE 1=1';
  const params = [];

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (project_code) {
    sql += ' AND project_code = ?';
    params.push(project_code);
  }

  sql += ' ORDER BY submitted_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 10. SUBMIT BOM ITEM
app.post('/api/bom', (req, res) => {
  const {
    project_code, item_name, part_number, category, quantity,
    unit_price, supplier_url, datasheet_url, justification, submitted_by
  } = req.body;

  if (!item_name || !project_code) {
    return res.status(400).json({ error: 'Item name and project code are required.' });
  }

  const qty = Number(quantity) || 1;
  const price = Number(unit_price) || 0;
  const total = qty * price;

  const sql = `
    INSERT INTO bom_items (
      project_code, item_name, part_number, category, quantity, unit_price,
      total_price, supplier_url, datasheet_url, justification, status, submitted_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `;

  db.run(
    sql,
    [project_code, item_name, part_number || '', category || 'Components', qty, price, total, supplier_url || '', datasheet_url || '', justification || '', submitted_by || 'Student Lead'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run('UPDATE projects SET bom_status = "Submitted", updated_at = CURRENT_TIMESTAMP WHERE project_code = ?', [project_code]);
      res.status(201).json({ id: this.lastID, message: 'BOM item requisition submitted for approval' });
    }
  );
});

// 11. APPROVE / REJECT BOM ITEM
app.put('/api/bom/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, admin_remarks } = req.body;

  if (!['Pending', 'Approved', 'Rejected', 'Ordered', 'Received'].includes(status)) {
    return res.status(400).json({ error: 'Invalid BOM status' });
  }

  const sql = `
    UPDATE bom_items SET
      status = ?,
      admin_remarks = COALESCE(?, admin_remarks)
    WHERE id = ?
  `;

  db.run(sql, [status, admin_remarks, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `BOM requisition status set to ${status}` });
  });
});

// 12. ADD COMMENT / ACTIVITY
app.post('/api/projects/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, author_role, message } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  const sql = `
    INSERT INTO activities (project_id, author, author_role, message, type)
    VALUES (?, ?, ?, ?, 'comment')
  `;

  db.run(sql, [id, author || 'Student', author_role || 'Member', message], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('UPDATE projects SET comments_count = comments_count + 1 WHERE id = ?', [id]);
    res.status(201).json({ id: this.lastID, message: 'Comment posted' });
  });
});

// 13. ANALYTICS & STATS DASHBOARD
app.get('/api/analytics', (req, res) => {
  const stats = {};

  db.all('SELECT status, COUNT(*) as count, AVG(progress) as avg_progress FROM projects GROUP BY status', [], (err, statusRows) => {
    if (err) return res.status(500).json({ error: err.message });

    stats.byStatus = { in_queue: 0, in_progress: 0, testing: 0, completed: 0 };
    let totalProjects = 0;
    let sumProgress = 0;
    (statusRows || []).forEach(r => {
      stats.byStatus[r.status] = r.count;
      totalProjects += r.count;
      sumProgress += (r.avg_progress * r.count);
    });
    stats.totalProjects = totalProjects;
    stats.overallProgress = totalProjects > 0 ? Math.round(sumProgress / totalProjects) : 0;

    db.all('SELECT domain, COUNT(*) as count FROM projects GROUP BY domain', [], (err, domainRows) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.byDomain = domainRows || [];

      db.all('SELECT status, SUM(total_price) as total, COUNT(*) as count FROM bom_items GROUP BY status', [], (err, bomRows) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.bomStats = bomRows || [];

        const pendingBOM = (bomRows || []).find(b => b.status === 'Pending');
        stats.pendingBOMCount = pendingBOM ? pendingBOM.count : 0;
        stats.pendingBOMTotal = pendingBOM ? pendingBOM.total : 0;

        const approvedBOM = (bomRows || []).find(b => b.status === 'Approved');
        stats.approvedBOMTotal = approvedBOM ? approvedBOM.total : 0;

        const today = new Date().toISOString().split('T')[0];
        db.get('SELECT COUNT(*) as overdue FROM projects WHERE due_date < ? AND status != "completed"', [today], (err, overdueRow) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.overdueCount = overdueRow ? overdueRow.overdue : 0;

          res.json(stats);
        });
      });
    });
  });
});

// 14. EXPORT TO JSON
app.get('/api/export/json', (req, res) => {
  db.all('SELECT * FROM projects', [], (err, projects) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT * FROM bom_items', [], (err, boms) => {
      if (err) return res.status(500).json({ error: err.message });
      db.all('SELECT * FROM students', [], (err, students) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const backup = {
          export_date: new Date().toISOString(),
          lab_name: 'IGRID Innovation Lab',
          projects,
          bom_items: boms,
          students
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="igrid_lab_backup.json"');
        res.send(JSON.stringify(backup, null, 2));
      });
    });
  });
});

// 15. EXPORT TO CSV
app.get('/api/export/csv', (req, res) => {
  db.all('SELECT project_code, title, domain, tags, status, priority, progress, start_date, due_date, immediate_action, github_repo, youtube_url, linkedin_url, bom_status, team_name, team_lead FROM projects', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const headers = ['Project Code', 'Title', 'Domain', 'Tags', 'Status', 'Priority', 'Progress %', 'Start Date', 'Due Date', 'Immediate Action', 'GitHub Repo', 'YouTube Demo', 'LinkedIn Post', 'BOM Status', 'Team Name', 'Team Lead'];
    const csvRows = [headers.join(',')];

    rows.forEach(r => {
      const values = [
        `"${r.project_code || ''}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.domain || ''}"`,
        `"${(r.tags || '').replace(/"/g, '""')}"`,
        `"${r.status || ''}"`,
        `"${r.priority || ''}"`,
        `"${r.progress || 0}"`,
        `"${r.start_date || ''}"`,
        `"${r.due_date || ''}"`,
        `"${(r.immediate_action || '').replace(/"/g, '""')}"`,
        `"${r.github_repo || ''}"`,
        `"${r.youtube_url || ''}"`,
        `"${r.linkedin_url || ''}"`,
        `"${r.bom_status || ''}"`,
        `"${r.team_name || ''}"`,
        `"${r.team_lead || ''}"`
      ];
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="igrid_lab_projects.csv"');
    res.send(csvRows.join('\n'));
  });
});

// Catch-all route to serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 IGRID Innovation Lab PM Dashboard is running!`);
  console.log(`🌐 Local Access:   http://localhost:${PORT}`);
  console.log(`📡 Network/Docker: http://0.0.0.0:${PORT}`);
  console.log(`====================================================`);
});
