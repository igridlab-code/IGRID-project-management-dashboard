const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'igrid_lab_dashboard_session_secret_2026_auth';

// Initialize Database
initDb();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@igridlab.edu.in').toLowerCase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE & GATING
// ----------------------------------------------------

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.headers['x-access-token'] || req.query.token;

  if (!token) {
    req.user = { id: null, role: 'public', isPublic: true };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user) {
      req.user = { id: null, role: 'public', isPublic: true };
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.headers['x-access-token'] || req.query.token;

  if (!token) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in as a student or administrator.' });
    }
    return res.redirect('/login');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
      }
      return res.redirect('/login');
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
  }
  next();
}

// ----------------------------------------------------
// AUDIT LOGGING HELPER
// ----------------------------------------------------
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = String(forwarded).split(',');
    return list[0].trim();
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
}

function logAuditEvent({ email, role, team_name, ip_address, method, event_type, status, details }) {
  const cleanEmail = (email || '').toLowerCase().trim();
  const userRole = role || 'student';
  const loginMethod = method || 'Email / Password';
  const ip = ip_address || '127.0.0.1';
  const type = event_type || 'LOGIN';
  const logStatus = status || 'SUCCESS';
  const detailStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : '';

  if (team_name && team_name !== 'N/A') {
    insertLog(team_name);
  } else {
    db.get('SELECT team_name, assigned_project, project_title FROM students WHERE LOWER(email) = ?', [cleanEmail], (err, row) => {
      let resolvedTeam = 'N/A';
      if (userRole === 'admin') {
        resolvedTeam = 'IGRID Lab Admin Core';
      } else if (userRole === 'viewer') {
        resolvedTeam = 'Public Viewer';
      } else if (row) {
        resolvedTeam = row.team_name || row.assigned_project || row.project_title || 'Student Innovator';
      }
      insertLog(resolvedTeam);
    });
  }

  function insertLog(team) {
    const sql = `
      INSERT INTO audit_logs (email, role, team_name, method, ip_address, event_type, status, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    db.run(sql, [cleanEmail, userRole, team || 'N/A', loginMethod, ip, type, logStatus, detailStr], function(err) {
      if (err) {
        console.error('[Audit Log Insert Error]', err.message);
      }
    });
  }
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES (UNPROTECTED)
// ----------------------------------------------------

// Serve Login / Signup Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 1. SIGNUP (Email + Password with student profile or viewer creation)
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, roll_no, phone, department, year, section, project_title, team_members, guide } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  let role = 'student';
  if (cleanEmail === ADMIN_EMAIL) {
    role = 'admin';
  } else if (req.body.role === 'viewer' || cleanEmail.includes('viewer') || cleanEmail.includes('showcase')) {
    role = 'viewer';
  }

  const displayName = name || cleanEmail.split('@')[0];
  const hash = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO auth_users (email, password_hash, name, role, auth_provider)
    VALUES (?, ?, ?, ?, 'email')
  `;

  db.run(sql, [cleanEmail, hash, displayName, role], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }

    const userId = this.lastID;

    // Instant access for Public Showcase Viewers without student profile requirement
    if (role === 'viewer') {
      const token = jwt.sign({
        id: userId,
        email: cleanEmail,
        name: displayName,
        role: 'viewer',
        student_id: null
      }, JWT_SECRET, { expiresIn: '7d' });

      logAuditEvent({
        email: cleanEmail,
        role: 'viewer',
        team_name: 'Public Viewer',
        ip_address: getClientIp(req),
        method: 'Registration',
        event_type: 'SIGNUP',
        status: 'SUCCESS',
        details: 'Public Showcase Viewer Signup'
      });
      logAuditEvent({
        email: cleanEmail,
        role: 'viewer',
        team_name: 'Public Viewer',
        ip_address: getClientIp(req),
        method: 'Instant Auth',
        event_type: 'LOGIN',
        status: 'SUCCESS',
        details: 'Initial Session'
      });

      return res.status(201).json({
        message: 'Public Viewer account created successfully',
        token,
        user: { id: userId, email: cleanEmail, name: displayName, role: 'viewer', student_id: null }
      });
    }

    // Create student profile automatically if student ID / roll_no provided or student role
    const studentRoll = roll_no || `REG-${Date.now().toString().slice(-6)}`;
    const studentSql = `
      INSERT INTO students (
        user_id, name, roll_no, email, phone, department, year, section,
        assigned_project, project_title, team_members, guide, status, progress
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const studentParams = [
      userId, displayName, studentRoll, cleanEmail, phone || '', department || 'IGRID Lab',
      year || '1st Year', section || 'A', project_title || '', project_title || '',
      team_members || '', guide || '', 'Active', 0
    ];

    db.run(studentSql, studentParams, function(err2) {
      if (err2) {
        console.error('Error creating student record during signup:', err2.message);
      }
      const newStudentId = (this && this.lastID) ? this.lastID : null;

      db.get('SELECT id FROM students WHERE user_id = ? OR email = ?', [userId, cleanEmail], (err3, stRow) => {
        const studentId = stRow ? stRow.id : newStudentId;

        const token = jwt.sign({
          id: userId,
          email: cleanEmail,
          name: displayName,
          role: role,
          student_id: studentId
        }, JWT_SECRET, { expiresIn: '7d' });

        logAuditEvent({
          email: cleanEmail,
          role: role,
          team_name: project_title || (stRow ? stRow.team_name : 'Student Innovator'),
          ip_address: getClientIp(req),
          method: 'Registration',
          event_type: 'SIGNUP',
          status: 'SUCCESS',
          details: `${role} Registration`
        });
        logAuditEvent({
          email: cleanEmail,
          role: role,
          team_name: project_title || (stRow ? stRow.team_name : 'Student Innovator'),
          ip_address: getClientIp(req),
          method: 'Account First Login',
          event_type: 'LOGIN',
          status: 'SUCCESS',
          details: 'Initial Session'
        });

        res.status(201).json({
          message: 'Account created successfully',
          token,
          user: { id: userId, email: cleanEmail, name: displayName, role, student_id: studentId }
        });
      });
    });
  });
});

// 2. LOGIN (Email + Password verification)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM auth_users WHERE email = ?', [cleanEmail], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user || !user.password_hash) {
      logAuditEvent({
        email: cleanEmail,
        role: cleanEmail === ADMIN_EMAIL ? 'admin' : 'unknown',
        team_name: 'N/A',
        ip_address: getClientIp(req),
        method: req.body.auth_provider === 'google' ? 'Google OAuth' : 'Email / Password',
        event_type: 'LOGIN_FAILED',
        status: 'FAILED',
        details: 'User does not exist'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      logAuditEvent({
        email: cleanEmail,
        role: user.role || 'student',
        team_name: 'N/A',
        ip_address: getClientIp(req),
        method: req.body.auth_provider === 'google' ? 'Google OAuth' : 'Email / Password',
        event_type: 'LOGIN_FAILED',
        status: 'FAILED',
        details: 'Password mismatch'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRole = user.role || (cleanEmail === ADMIN_EMAIL ? 'admin' : 'student');

    // Find student record if any
    db.get('SELECT id, team_name, assigned_project, project_title FROM students WHERE user_id = ? OR email = ?', [user.id, cleanEmail], (err2, student) => {
      const studentId = student ? student.id : null;

      const token = jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: userRole,
        student_id: studentId
      }, JWT_SECRET, { expiresIn: '7d' });

      logAuditEvent({
        email: user.email,
        role: userRole,
        team_name: student ? (student.team_name || student.assigned_project || student.project_title) : (userRole === 'admin' ? 'IGRID Lab Admin Core' : (userRole === 'viewer' ? 'Public Viewer' : 'N/A')),
        ip_address: getClientIp(req),
        method: req.body.auth_provider === 'google' ? 'Google OAuth' : 'Email / Password',
        event_type: 'LOGIN',
        status: 'SUCCESS'
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: userRole,
          student_id: studentId
        }
      });
    });
  });
});

// LOGOUT ENDPOINT (Audit Trail)
app.post('/api/auth/logout', optionalAuth, (req, res) => {
  if (req.user && req.user.email) {
    logAuditEvent({
      email: req.user.email,
      role: req.user.role || 'student',
      ip_address: getClientIp(req),
      method: 'User Interface',
      event_type: 'LOGOUT',
      status: 'SUCCESS',
      details: 'User initiated logout'
    });
  }
  res.json({ message: 'Logged out successfully' });
});

// ----------------------------------------------------
// ADMIN AUDIT LOGS ENDPOINTS (ADMIN ONLY)
// ----------------------------------------------------
app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req, res) => {
  const { search, role, event_type, start_date, end_date, page = 1, limit = 50 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(email LIKE ? OR team_name LIKE ? OR ip_address LIKE ? OR method LIKE ?)');
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s);
  }

  if (role && role !== 'all') {
    whereClauses.push('LOWER(role) = ?');
    params.push(role.toLowerCase());
  }

  if (event_type && event_type !== 'all') {
    whereClauses.push('event_type = ?');
    params.push(event_type);
  }

  if (start_date) {
    whereClauses.push('date(timestamp) >= date(?)');
    params.push(start_date);
  }

  if (end_date) {
    whereClauses.push('date(timestamp) <= date(?)');
    params.push(end_date);
  }

  const whereSql = whereClauses.join(' AND ');

  // 1. Total Count for pagination
  db.get(`SELECT COUNT(*) as total FROM audit_logs WHERE ${whereSql}`, params, (errCount, countRow) => {
    if (errCount) return res.status(500).json({ error: errCount.message });
    const total = countRow ? countRow.total : 0;

    // 2. Fetch paginated records
    const querySql = `
      SELECT * FROM audit_logs
      WHERE ${whereSql}
      ORDER BY timestamp DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limitNum, offset];

    db.all(querySql, queryParams, (errLogs, logs) => {
      if (errLogs) return res.status(500).json({ error: errLogs.message });

      // 3. Compute Anomaly / Multi-IP flags
      db.all(`
        SELECT email, COUNT(DISTINCT ip_address) as distinct_ips
        FROM audit_logs
        WHERE timestamp >= datetime('now', '-24 hours') AND event_type = 'LOGIN' AND status = 'SUCCESS'
        GROUP BY email
        HAVING distinct_ips > 1
      `, [], (errAnom, anomRows) => {
        const suspiciousEmails = new Set((anomRows || []).map(r => r.email.toLowerCase()));

        const processedLogs = (logs || []).map(l => {
          const isSuspicious = suspiciousEmails.has((l.email || '').toLowerCase()) && l.event_type === 'LOGIN';
          return {
            ...l,
            is_suspicious: isSuspicious,
            suspicious_reason: isSuspicious ? 'Multiple distinct IP logins detected within 24h' : null
          };
        });

        // 4. Compute Summary Stats
        db.get(`
          SELECT 
            COUNT(CASE WHEN event_type = 'LOGIN' AND status = 'SUCCESS' THEN 1 END) as total_logins,
            COUNT(DISTINCT CASE WHEN event_type = 'LOGIN' AND status = 'SUCCESS' THEN email END) as unique_users,
            COUNT(CASE WHEN event_type = 'LOGIN' AND status = 'SUCCESS' AND date(timestamp) = date('now') THEN 1 END) as today_logins,
            COUNT(CASE WHEN event_type = 'LOGIN_FAILED' THEN 1 END) as failed_logins
          FROM audit_logs
        `, [], (errSummary, summary) => {
          res.json({
            logs: processedLogs,
            total,
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(total / limitNum) || 1,
            summary: {
              total_logins: summary ? (summary.total_logins || 0) : 0,
              unique_users: summary ? (summary.unique_users || 0) : 0,
              today_logins: summary ? (summary.today_logins || 0) : 0,
              failed_logins: summary ? (summary.failed_logins || 0) : 0,
              suspicious_accounts_count: suspiciousEmails.size
            }
          });
        });
      });
    });
  });
});

// CSV EXPORT ENDPOINT (ADMIN ONLY)
app.get('/api/admin/audit-logs/export', requireAuth, requireAdmin, (req, res) => {
  const { search, role, event_type, start_date, end_date } = req.query;

  let whereClauses = ['1=1'];
  let params = [];

  if (search) {
    whereClauses.push('(email LIKE ? OR team_name LIKE ? OR ip_address LIKE ? OR method LIKE ?)');
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s);
  }
  if (role && role !== 'all') {
    whereClauses.push('LOWER(role) = ?');
    params.push(role.toLowerCase());
  }
  if (event_type && event_type !== 'all') {
    whereClauses.push('event_type = ?');
    params.push(event_type);
  }
  if (start_date) {
    whereClauses.push('date(timestamp) >= date(?)');
    params.push(start_date);
  }
  if (end_date) {
    whereClauses.push('date(timestamp) <= date(?)');
    params.push(end_date);
  }

  const sql = `
    SELECT id, email, role, team_name, method, ip_address, event_type, status, details, timestamp
    FROM audit_logs
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY timestamp DESC
    LIMIT 5000
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const csvHeaders = 'ID,Timestamp_UTC,Email,Role,Team,Method,IP_Address,Event_Type,Status,Details\n';
    const csvRows = (rows || []).map(r => {
      return [
        r.id,
        `"${r.timestamp}"`,
        `"${r.email}"`,
        `"${r.role}"`,
        `"${(r.team_name || '').replace(/"/g, '""')}"`,
        `"${(r.method || '').replace(/"/g, '""')}"`,
        `"${r.ip_address}"`,
        `"${r.event_type}"`,
        `"${r.status}"`,
        `"${(r.details || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;
    const filename = `igrid_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  });
});

// 3. FORGOT PASSWORD (Generate email reset token)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM auth_users WHERE email = ?', [cleanEmail], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      // For security, return success even if email not found
      return res.json({ message: 'If an account exists for that email, a password reset link has been generated.' });
    }

    // Generate secure random reset token expiring in 1 hour
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.run('UPDATE auth_users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expires, user.id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        message: 'Password reset link generated successfully.',
        reset_token: resetToken,
        reset_url: `/login?reset_token=${resetToken}`
      });
    });
  });
});

// 5. RESET PASSWORD (Verify token and update password)
app.post('/api/auth/reset-password', (req, res) => {
  const { reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const now = new Date().toISOString();

  db.get('SELECT * FROM auth_users WHERE reset_token = ? AND reset_token_expires > ?', [reset_token, now], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);

    db.run(
      'UPDATE auth_users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [newHash, user.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
      }
    );
  });
});

// 6. GET CURRENT SESSION
app.get('/api/auth/session', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// PROTECTED DASHBOARD API ROUTES
// ----------------------------------------------------

// GET ALL DOMAINS
app.get('/api/domains', (req, res) => {
  db.all('SELECT * FROM domains ORDER BY id ASC', [], (err, domainRows) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all('SELECT DISTINCT domain FROM projects WHERE domain IS NOT NULL AND domain != ""', [], (err2, projectDomains) => {
      const existingNames = new Set((domainRows || []).map(d => d.name.toLowerCase()));
      const merged = [...(domainRows || [])];

      (projectDomains || []).forEach(p => {
        if (p.domain && !existingNames.has(p.domain.toLowerCase())) {
          existingNames.add(p.domain.toLowerCase());
          merged.push({ id: Date.now() + Math.random(), name: p.domain, description: '' });
        }
      });

      res.json(merged);
    });
  });
});

// POST CREATE NEW DOMAIN
app.post('/api/domains', (req, res) => {
  const { name, description } = req.body;
  const trimmedName = (name || '').trim();

  if (!trimmedName) {
    return res.status(400).json({ error: 'Please enter a domain name.' });
  }

  // Check case-insensitive duplicate in domains table
  db.get('SELECT * FROM domains WHERE LOWER(name) = LOWER(?)', [trimmedName], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: 'Domain name already exists.' });
    }

    // Insert domain
    db.run('INSERT INTO domains (name, description) VALUES (?, ?)', [trimmedName, (description || '').trim()], function(err2) {
      if (err2) {
        if (err2.message && err2.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Domain name already exists.' });
        }
        return res.status(500).json({ error: err2.message });
      }

      res.status(201).json({
        message: 'Domain added successfully.',
        domain: {
          id: this.lastID,
          name: trimmedName,
          description: (description || '').trim()
        }
      });
    });
  });
});

// GET ALL PROJECTS (PUBLIC SHOWCASE & AUTHENTICATED)
app.get('/api/projects', optionalAuth, (req, res) => {
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

  if (tag && tag !== '#all' && tag !== 'all' && tag !== 'All') {
    const rawTag = tag.trim();
    const cleanTag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
    sql += ' AND (tags LIKE ? OR tags LIKE ?)';
    params.push(`%#${cleanTag}%`, `%${cleanTag}%`);
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

// PUBLIC SHOWCASE DIRECT ALIAS
app.get('/api/public/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY updated_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const projects = rows.map(r => {
      let members = [];
      try { members = r.team_members ? JSON.parse(r.team_members) : []; } catch(e) { members = []; }
      return { ...r, team_members: members };
    });
    res.json(projects);
  });
});

// GET SINGLE PROJECT WITH BOM & ACTIVITIES (PUBLIC & AUTHENTICATED)
app.get('/api/projects/:id', optionalAuth, (req, res) => {
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

// CREATE PROJECT (ADMIN OR STUDENT)
app.post('/api/projects', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  const {
    project_code, title, description, domain, tags, status, priority,
    progress, start_date, due_date, immediate_action, github_repo,
    youtube_url, linkedin_url, doc_url, image_url,
    bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables
  } = req.body;

  if (!title || !domain) {
    return res.status(400).json({ error: 'Title and Domain are required.' });
  }

  const code = project_code || `IGRID-${(domain || 'GEN').substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  const membersJson = typeof team_members === 'string' ? team_members : JSON.stringify(team_members || []);
  const leadName = (req.user && req.user.role === 'student') ? (req.user.name || team_lead || '') : (team_lead || '');

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
      bom_status || 'Not Required', team_name || '', leadName, team_lead_photo || '', membersJson, deliverables || ''
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, project_code: code, message: 'Project created successfully.' });
    }
  );
});

// UPDATE PROJECT (ROLE-BASED: ADMIN HAS FULL ACCESS; STUDENT CAN ONLY EDIT OWN MEDIA & LINKS)
app.put('/api/projects/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isAdmin = user && user.role === 'admin';

  if (user && (user.role === 'viewer' || user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // If Student: Verify row-level ownership
    if (!isAdmin) {
      const userEmail = (user.email || '').toLowerCase();
      const userName = (user.name || '').toLowerCase();
      const isLead = project.team_lead && project.team_lead.toLowerCase().includes(userName);
      const isMember = project.team_members && (project.team_members.toLowerCase().includes(userEmail) || project.team_members.toLowerCase().includes(userName));
      
      // Also check student table
      db.get('SELECT * FROM students WHERE user_id = ? OR LOWER(email) = ?', [user.id, userEmail], (err2, student) => {
        const isAssigned = student && (student.assigned_project === project.project_code || student.project_title === project.title);
        
        if (!isLead && !isMember && !isAssigned) {
          return res.status(403).json({ error: 'Access denied: Students can only edit their own project links and deliverables.' });
        }

        // Student is permitted to update ONLY media and deliverable links
        const {
          github_repo, youtube_url, linkedin_url, doc_url, image_url,
          team_lead_photo, deliverables
        } = req.body;

        const updateSql = `
          UPDATE projects SET
            github_repo = COALESCE(?, github_repo),
            youtube_url = COALESCE(?, youtube_url),
            linkedin_url = COALESCE(?, linkedin_url),
            doc_url = COALESCE(?, doc_url),
            image_url = COALESCE(?, image_url),
            team_lead_photo = COALESCE(?, team_lead_photo),
            deliverables = COALESCE(?, deliverables),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.run(
          updateSql,
          [github_repo, youtube_url, linkedin_url, doc_url, image_url, team_lead_photo, deliverables, id],
          function(err3) {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ message: 'Project links and deliverables updated successfully.', changes: this.changes });
          }
        );
      });
      return;
    }

    // Admin has full CRUD access to all fields
    const {
      project_code,
      title, description, domain, tags, status, priority,
      progress, start_date, due_date, immediate_action, github_repo,
      youtube_url, linkedin_url, doc_url, image_url,
      bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables,
      is_active, isActive
    } = req.body;

    const membersJson = team_members !== undefined
      ? (typeof team_members === 'string' ? team_members : JSON.stringify(team_members || []))
      : null;

    const progressNum = (progress !== undefined && progress !== null && progress !== '')
      ? Number(progress)
      : null;

    let activeStateNum = null;
    if (is_active !== undefined || isActive !== undefined) {
      const activeRaw = is_active !== undefined ? is_active : isActive;
      activeStateNum = (activeRaw === true || activeRaw === 1 || activeRaw === '1' || activeRaw === 'true') ? 1 : 0;
    }

    const sql = `
      UPDATE projects SET
        project_code = COALESCE(?, project_code),
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
        is_active = COALESCE(?, is_active, 1),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(
      sql,
      [
        project_code,
        title, description, domain, tags, status, priority,
        progressNum,
        start_date, due_date, immediate_action, github_repo,
        youtube_url, linkedin_url, doc_url, image_url,
        bom_status, team_name, team_lead, team_lead_photo, membersJson, deliverables,
        activeStateNum,
        id
      ],
      function(err4) {
        if (err4) return res.status(500).json({ error: err4.message });
        res.json({ message: 'Project updated successfully by Administrator.', changes: this.changes });
      }
    );
  });
});

// UPDATE PROJECT STATUS / STAGE (ADMIN ONLY)
const handleProjectStageUpdate = (req, res) => {
  const { id } = req.params;
  const status = req.body.status || req.body.stage;
  const progress = req.body.progress;

  const validStatuses = ['in_queue', 'in_progress', 'testing', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status/stage. Must be one of: ${validStatuses.join(', ')}` });
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
    if (this.changes === 0) return res.status(404).json({ error: 'Project not found' });

    const adminName = (req.user && (req.user.name || req.user.email)) || 'Administrator';
    db.run(
      'INSERT INTO activities (project_id, author, author_role, message, type) VALUES (?, ?, ?, ?, ?)',
      [id, adminName, 'Coordinator', `Moved status to ${status.replace('_', ' ').toUpperCase()} (Progress: ${newProgress}%)`, 'status_change'],
      () => {}
    );

    res.json({ message: 'Stage updated successfully', status, progress: newProgress });
  });
};

app.put('/api/projects/:id/status', requireAuth, requireAdmin, handleProjectStageUpdate);
app.patch('/api/projects/:id/status', requireAuth, requireAdmin, handleProjectStageUpdate);
app.patch('/api/projects/:id/stage', requireAuth, requireAdmin, handleProjectStageUpdate);

// ADMIN ONLY: TOGGLE PROJECT ACTIVE / INACTIVE (ON/OFF) STATUS
function handleProjectActiveToggle(req, res) {
  const { id } = req.params;
  const user = req.user;

  try {
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
      if (err) {
        console.error('[Error] Failed to fetch project for toggle:', err);
        return res.status(500).json({ error: `Database query failed: ${err.message}` });
      }
      if (!project) {
        return res.status(404).json({ error: `Project #${id} not found.` });
      }

      let newActiveState;
      const bodyVal = req.body
        ? (req.body.is_active !== undefined ? req.body.is_active : (req.body.isActive !== undefined ? req.body.isActive : req.body.active))
        : undefined;

      if (bodyVal !== undefined) {
        if (typeof bodyVal === 'boolean') {
          newActiveState = bodyVal ? 1 : 0;
        } else if (typeof bodyVal === 'string') {
          const str = bodyVal.trim().toLowerCase();
          newActiveState = (str === 'true' || str === '1' || str === 'active' || str === 'on') ? 1 : 0;
        } else if (typeof bodyVal === 'number') {
          newActiveState = bodyVal === 1 ? 1 : 0;
        } else {
          newActiveState = bodyVal ? 1 : 0;
        }
      } else {
        const current = (project.is_active === undefined || project.is_active === null) ? 1 : Number(project.is_active);
        newActiveState = current === 1 ? 0 : 1;
      }

      const updateSql = `UPDATE projects SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(updateSql, [newActiveState, id], function(updateErr) {
        if (updateErr) {
          console.error('[Error] Failed to update project is_active:', updateErr);
          return res.status(500).json({ error: `Failed to update project status: ${updateErr.message}` });
        }

        // Log audit event
        logAuditEvent({
          email: user.email,
          role: 'admin',
          team_name: user.team_name || project.team_name || 'Admin',
          event_type: 'PROJECT_STATUS_TOGGLE',
          method: 'Project Status Toggle',
          status: 'SUCCESS',
          ip_address: getClientIp(req),
          details: `Project "${project.project_code} - ${project.title}" toggled to ${newActiveState === 1 ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}`
        });

        db.get('SELECT * FROM projects WHERE id = ?', [id], (fetchErr, updatedProject) => {
          const finalProj = updatedProject || { ...project, is_active: newActiveState };
          res.json({
            message: `Project ${finalProj.project_code} is now ${newActiveState === 1 ? 'Active (ON)' : 'Inactive (OFF)'}`,
            is_active: newActiveState,
            isActive: newActiveState === 1,
            project: {
              ...finalProj,
              is_active: newActiveState,
              isActive: newActiveState === 1
            }
          });
        });
      });
    });
  } catch (ex) {
    console.error('[Unhandled Error in handleProjectActiveToggle]:', ex);
    res.status(500).json({ error: `Internal server error: ${ex.message}` });
  }
}

app.patch('/api/projects/:id/toggle-active', requireAuth, requireAdmin, handleProjectActiveToggle);
app.post('/api/projects/:id/toggle-active', requireAuth, requireAdmin, handleProjectActiveToggle);
app.patch('/api/projects/:id/active', requireAuth, requireAdmin, handleProjectActiveToggle);
app.put('/api/projects/:id/active', requireAuth, requireAdmin, handleProjectActiveToggle);

// ADMIN ONLY: UPDATE PROJECT DATES / DEADLINE
app.patch('/api/projects/:id/dates', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { start_date, due_date } = req.body;

  if (!start_date && !due_date) {
    return res.status(400).json({ error: 'At least one date (start_date or due_date) must be provided.' });
  }

  const sql = `
    UPDATE projects SET
      start_date = COALESCE(?, start_date),
      due_date = COALESCE(?, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [start_date || null, due_date || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Project not found' });

    db.get('SELECT id, project_code, title, start_date, due_date, updated_at FROM projects WHERE id = ?', [id], (err2, project) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Log date update in audit logs
      logAuditEvent({
        email: req.user.email,
        role: 'admin',
        team_name: 'IGRID Lab Admin Core',
        ip_address: getClientIp(req),
        method: 'Admin Quick Date Edit',
        event_type: 'DATE_UPDATE',
        status: 'SUCCESS',
        details: `Updated dates for project ${project.project_code} (Start: ${project.start_date}, Due: ${project.due_date})`
      });

      res.json({
        message: 'Project timeline dates updated successfully by administrator.',
        project
      });
    });
  });
});

// ADMIN ONLY: UPDATE AUDIT LOG ENTRY (TIMESTAMP / DETAILS)
app.patch('/api/admin/audit-logs/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { timestamp, details } = req.body;

  if (!timestamp && !details) {
    return res.status(400).json({ error: 'At least timestamp or details must be provided.' });
  }

  const sql = `
    UPDATE audit_logs SET
      timestamp = COALESCE(?, timestamp),
      details = COALESCE(?, details)
    WHERE id = ?
  `;

  db.run(sql, [timestamp || null, details || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Audit log record not found' });

    db.get('SELECT * FROM audit_logs WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Audit log record updated successfully.', log: row });
    });
  });
});

// DELETE PROJECT (ADMIN ONLY)
app.delete('/api/projects/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project deleted', changes: this.changes });
  });
});

// GET STUDENTS (PUBLIC SHOWCASE & AUTHENTICATED)
app.get('/api/students', optionalAuth, (req, res) => {
  db.all('SELECT * FROM students ORDER BY name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET SINGLE STUDENT PROFILE (PUBLIC SHOWCASE & AUTHENTICATED)
app.get('/api/students/:id', optionalAuth, (req, res) => {
  const reqStudentId = Number(req.params.id);
  db.get('SELECT * FROM students WHERE id = ?', [reqStudentId], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student);
  });
});

// UPDATE STUDENT PROFILE (ADMIN HAS FULL ACCESS, STUDENT CAN ONLY UPDATE PERMITTED PERSONAL INFO)
app.put('/api/students/:id', requireAuth, (req, res) => {
  const reqStudentId = Number(req.params.id);
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;

  if (userRole === 'viewer' || userRole === 'public') {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  db.get('SELECT * FROM students WHERE id = ?', [reqStudentId], (err, existingStudent) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existingStudent) return res.status(404).json({ error: 'Student record not found.' });

    const isSelf = (req.user.student_id && Number(req.user.student_id) === reqStudentId) ||
                   (existingStudent.user_id && Number(existingStudent.user_id) === Number(req.user.id)) ||
                   (existingStudent.email && existingStudent.email.toLowerCase() === userEmail);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Access denied. You cannot modify another student\'s profile.' });
    }

    if (isAdmin) {
      const {
        name, roll_no, email, phone, department, year, section, college,
        role, skills, photo_url, github_url, linkedin_url, bio, assigned_project,
        project_title, project_desc, team_members, guide, status, progress
      } = req.body;

      if (!name || !roll_no) {
        return res.status(400).json({ error: 'Student Name and Register Number are required.' });
      }

      const sql = `
        UPDATE students SET
          name = ?, roll_no = ?, email = ?, phone = ?, department = ?, year = ?,
          section = ?, college = ?, role = ?, skills = ?, photo_url = ?,
          github_url = ?, linkedin_url = ?, bio = ?, assigned_project = ?,
          project_title = ?, project_desc = ?, team_members = ?, guide = ?,
          status = ?, progress = ?
        WHERE id = ?
      `;

      const params = [
        name, roll_no, email || '', phone || '', department || '', year || '',
        section || '', college || '', role || 'Member', skills || '', photo_url || '',
        github_url || '', linkedin_url || '', bio || '', assigned_project || project_title || '',
        project_title || assigned_project || '', project_desc || '', team_members || '', guide || '',
        status || 'Active', progress || 0,
        reqStudentId
      ];

      db.run(sql, params, function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        db.get('SELECT * FROM students WHERE id = ?', [reqStudentId], (err3, updated) => {
          res.json({ message: 'Student profile updated successfully', student: updated });
        });
      });
    } else {
      // Student self update: permitted personal fields ONLY
      const { phone, email, bio, photo_url, github_url, linkedin_url, skills } = req.body;

      const sql = `
        UPDATE students SET
          phone = ?, email = ?, bio = ?, photo_url = ?, github_url = ?, linkedin_url = ?, skills = ?
        WHERE id = ?
      `;

      const params = [
        phone || existingStudent.phone || '',
        email || existingStudent.email || '',
        bio || existingStudent.bio || '',
        photo_url || existingStudent.photo_url || '',
        github_url || existingStudent.github_url || '',
        linkedin_url || existingStudent.linkedin_url || '',
        skills || existingStudent.skills || '',
        reqStudentId
      ];

      db.run(sql, params, function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        db.get('SELECT * FROM students WHERE id = ?', [reqStudentId], (err3, updated) => {
          res.json({ message: 'Personal profile updated successfully', student: updated });
        });
      });
    }
  });
});

// ----------------------------------------------------
// MONTH-WISE STUDENT CALENDAR API ROUTES
// ----------------------------------------------------

// GET CALENDAR ACTIVITIES FOR A STUDENT
app.get('/api/students/:id/calendar', requireAuth, (req, res) => {
  const reqStudentId = Number(req.params.id);
  db.all('SELECT * FROM student_calendar WHERE student_id = ? ORDER BY id ASC', [reqStudentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ADD MONTH-WISE CALENDAR ACTIVITY (ADMIN ONLY)
app.post('/api/students/:id/calendar', requireAuth, (req, res) => {
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Only Admins can manage student calendar activities.' });
  }

  const reqStudentId = Number(req.params.id);
  const { month, date, activity, status, progress, remarks } = req.body;

  if (!month || !activity) {
    return res.status(400).json({ error: 'Month and Activity description are required.' });
  }

  const sql = `
    INSERT INTO student_calendar (student_id, month, date, activity, status, progress, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [reqStudentId, month, date || '01', activity, status || 'Pending', progress || 0, remarks || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Calendar activity added successfully' });
  });
});

// UPDATE CALENDAR ACTIVITY (ADMIN ONLY)
app.put('/api/students/calendar/:activityId', requireAuth, (req, res) => {
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Only Admins can edit calendar activities.' });
  }

  const activityId = Number(req.params.activityId);
  const { month, date, activity, status, progress, remarks } = req.body;

  const sql = `
    UPDATE student_calendar SET
      month = ?, date = ?, activity = ?, status = ?, progress = ?, remarks = ?
    WHERE id = ?
  `;

  db.run(sql, [month, date, activity, status, progress, remarks, activityId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Calendar activity updated successfully' });
  });
});

// DELETE CALENDAR ACTIVITY (ADMIN ONLY)
app.delete('/api/students/calendar/:activityId', requireAuth, (req, res) => {
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Only Admins can delete calendar activities.' });
  }

  const activityId = Number(req.params.activityId);
  db.run('DELETE FROM student_calendar WHERE id = ?', [activityId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Calendar activity deleted successfully' });
  });
});

// GET BOM ITEMS
app.get('/api/bom', requireAuth, (req, res) => {
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

// SUBMIT BOM ITEM
app.post('/api/bom', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

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

// APPROVE / REJECT BOM ITEM (ADMIN ONLY)
app.put('/api/bom/:id/status', requireAuth, requireAdmin, (req, res) => {
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

// ----------------------------------------------------
// PROJECT-SPECIFIC TIMELINE TASKS ENDPOINTS
// ----------------------------------------------------

// GET TASKS FOR SPECIFIC PROJECT (PUBLIC SHOWCASE & AUTHENTICATED)
app.get('/api/projects/:id/tasks', optionalAuth, (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY start_date ASC, id ASC', [id], (err, tasks) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(tasks || []);
  });
});

app.get('/api/public/projects/:id/tasks', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY start_date ASC, id ASC', [id], (err, tasks) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(tasks || []);
  });
});

// CREATE TASK FOR SPECIFIC PROJECT
app.post('/api/projects/:id/tasks', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  const { id } = req.params;
  const { task_name, start_date, end_date, status, priority, description, assigned_member } = req.body;

  if (!task_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Task Name, Start Date, and End Date are required.' });
  }

  db.get('SELECT project_code FROM projects WHERE id = ?', [id], (err, proj) => {
    if (err || !proj) return res.status(404).json({ error: 'Project not found' });

    const sql = `
      INSERT INTO project_tasks (project_id, project_code, task_name, start_date, end_date, status, priority, description, assigned_member)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [id, proj.project_code, task_name.trim(), start_date, end_date, status || 'in_progress', priority || 'Normal', (description || '').trim(), (assigned_member || '').trim()],
      function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ id: this.lastID, message: 'Task created successfully.' });
      }
    );
  });
});

// UPDATE TASK
app.put('/api/tasks/:taskId', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  const { taskId } = req.params;
  const { task_name, start_date, end_date, status, priority, description, assigned_member } = req.body;

  if (!task_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Task Name, Start Date, and End Date are required.' });
  }

  const sql = `
    UPDATE project_tasks SET
      task_name = ?,
      start_date = ?,
      end_date = ?,
      status = ?,
      priority = ?,
      description = ?,
      assigned_member = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [task_name.trim(), start_date, end_date, status || 'in_progress', priority || 'Normal', (description || '').trim(), (assigned_member || '').trim(), taskId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Task updated successfully.' });
    }
  );
});

// DELETE TASK
app.delete('/api/tasks/:taskId', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }

  const { taskId } = req.params;
  db.run('DELETE FROM project_tasks WHERE id = ?', [taskId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted successfully.' });
  });
});

// ADD COMMENT / ACTIVITY
app.post('/api/projects/:id/comments', requireAuth, (req, res) => {
  if (req.user && (req.user.role === 'viewer' || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Access denied: Public Showcase Viewers have read-only permissions.' });
  }
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

// ANALYTICS & STATS DASHBOARD
app.get('/api/analytics', requireAuth, (req, res) => {
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

// EXPORT TO JSON
app.get('/api/export/json', requireAuth, (req, res) => {
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

// EXPORT TO CSV
app.get('/api/export/csv', requireAuth, (req, res) => {
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

// PUBLIC SPA ROUTES (/showcase, /public-view, /)
app.get(['/', '/showcase', '/public-view'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SPA Route Catch-All
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Levenshtein distance helper for fuzzy project name matching
function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b || '').length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeStr(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ----------------------------------------------------
// AI CHATBOT ASSISTANT ENDPOINT (FUZZY RETRIEVAL & CONVERSATIONAL MEMORY)
// ----------------------------------------------------
app.post('/api/chat', requireAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : '';
  const isAdmin = (req.user && req.user.role === 'admin') || userEmail === ADMIN_EMAIL;

  // 1. ALWAYS query ALL projects from database for project index lookup
  db.all('SELECT * FROM projects', [], async (err, projects) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all('SELECT * FROM bom_items', [], async (err2, boms) => {
      const allProjects = projects || [];
      const bomData = boms || [];

      const rawQ = message;
      const q = message.toLowerCase();
      const normQ = normalizeStr(message);

      // Handle Greetings
      const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'greetings'];
      if (greetings.includes(normQ)) {
        return res.json({
          reply: "Hello! I'm iGrid Assistant. I know every team's project details across the lab. Ask me about deadlines, status, progress, or team info for any project!"
        });
      }

      // Extract tokens for named matching
      const stopWords = ['tell', 'about', 'what', 'whats', 'is', 'are', 'the', 'deadline', 'status', 'progress', 'team', 'project', 'our', 'my', 'give', 'show', 'for', 'detail', 'details', 'current', 'which', 'higher', 'lower', 'more', 'less', 'their', 'this', 'that'];
      const tokens = normQ.split(' ').filter(w => w.length >= 3 && !stopWords.includes(w));

      // 2. Conversational Memory: Scan history for recently discussed project
      let memoryProject = null;
      if (Array.isArray(history) && history.length > 0) {
        for (let i = history.length - 1; i >= 0; i--) {
          const h = history[i];
          const hText = (h.content || '').toLowerCase();
          for (const p of allProjects) {
            if (hText.includes(p.project_code.toLowerCase()) || hText.includes((p.title || '').toLowerCase())) {
              memoryProject = p;
              break;
            }
          }
          if (memoryProject) break;
        }
      }

      // 3. Scoring projects for matching
      const scoredProjects = [];
      for (const p of allProjects) {
        const pCode = (p.project_code || '').toLowerCase();
        const pCodeNorm = normalizeStr(p.project_code);
        const pTitle = (p.title || '').toLowerCase();
        const pTitleNorm = normalizeStr(p.title);
        const pTeam = (p.team_name || '').toLowerCase();
        const pTeamNorm = normalizeStr(p.team_name);
        const pLead = (p.team_lead || '').toLowerCase();

        let score = 0;

        // Exact code match
        if (normQ.includes(pCodeNorm) || q.includes(pCode)) {
          score += 100;
        }

        // Title match
        if (pTitleNorm && (pTitleNorm.includes(normQ) || normQ.includes(pTitleNorm))) {
          score += 95;
        } else if (pTitleNorm) {
          for (const t of tokens) {
            if (pTitleNorm.includes(t)) {
              score += 60;
            }
          }
        }

        // Team name match
        if (pTeamNorm && normQ.includes(pTeamNorm)) {
          score += 85;
        } else if (pTeamNorm) {
          const teamCore = pTeamNorm.replace('team', '').trim();
          if (teamCore.length >= 3 && normQ.includes(teamCore)) {
            score += 75;
          }
        }

        // Team lead match
        if (pLead && normQ.includes(normalizeStr(pLead))) {
          score += 70;
        }

        // Typo / Levenshtein fuzzy match
        for (const t of tokens) {
          if (t.length >= 4) {
            const titleWords = pTitleNorm.split(' ').concat(pTeamNorm.split(' '));
            for (const tw of titleWords) {
              if (tw.length >= 4 && Math.abs(tw.length - t.length) <= 2) {
                const dist = levenshteinDistance(t, tw);
                if (dist === 1) score += 65;
                else if (dist === 2) score += 45;
              }
            }
          }
        }

        if (score >= 40) {
          scoredProjects.push({ project: p, score });
        }
      }

      // Sort scored projects descending
      scoredProjects.sort((a, b) => b.score - a.score);

      // Check for Disambiguation (Multiple close matches)
      if (scoredProjects.length >= 2) {
        const top1 = scoredProjects[0];
        const top2 = scoredProjects[1];
        if (top1.score >= 60 && Math.abs(top1.score - top2.score) <= 5 && top1.project.id !== top2.project.id) {
          return res.json({
            reply: `Did you mean **${top1.project.title}** (${top1.project.project_code}) or **${top2.project.title}** (${top2.project.project_code})?`
          });
        }
      }

      let matchedProject = null;
      if (scoredProjects.length > 0 && scoredProjects[0].score >= 50) {
        matchedProject = scoredProjects[0].project;
        console.log(`🎯 Chatbot Matched Project: ${matchedProject.project_code} - ${matchedProject.title} (Score: ${scoredProjects[0].score})`);
      }

      // Handle Follow-up queries using Conversational Memory
      const isFollowUp = (q.includes('their') || q.includes('it') || q.includes('this project') || q.includes('the deadline') || q.includes('the status') || q.includes('the progress')) && !matchedProject;
      if (isFollowUp && memoryProject) {
        matchedProject = memoryProject;
        console.log(`🔄 Chatbot Resolved Memory Project: ${matchedProject.project_code} - ${matchedProject.title}`);
      }

      // Handle Non-Existent Project Named Queries ("Team Unicorn")
      const isNamedQuery = (q.includes('team') || q.includes('project') || q.includes('about')) && tokens.length > 0;
      if (isNamedQuery && !matchedProject) {
        // Look for close name suggestion
        let suggestion = null;
        for (const p of allProjects) {
          const pTeamCore = normalizeStr(p.team_name).replace('team', '').trim();
          const pTitleCore = normalizeStr(p.title);
          for (const t of tokens) {
            if (levenshteinDistance(t, pTeamCore) <= 2 || levenshteinDistance(t, pTitleCore) <= 2) {
              suggestion = p;
              break;
            }
          }
          if (suggestion) break;
        }

        const notFoundName = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
        if (suggestion) {
          return res.json({ reply: `Couldn't find "${notFoundName}" in your project data. Did you mean **${suggestion.title}** (${suggestion.team_name || suggestion.project_code})?` });
        } else {
          return res.json({ reply: `Couldn't find "${notFoundName}" in your project data. Please check the project or team name.` });
        }
      }

      // Default to User's Team if query refers to "my project", "our team", or no project specified for narrow question
      if (!matchedProject && (q.includes('my') || q.includes('our') || q.includes('my team') || q.includes('my project'))) {
        matchedProject = allProjects.find(p => p.project_code === req.user.team_code || (p.team_name && p.team_name.includes(req.user.team_code))) || allProjects[0];
      }

      // Construct Full Record for Matched Project
      let matchedFullRecord = null;
      if (matchedProject) {
        const projBoms = bomData.filter(b => b.project_code === matchedProject.project_code);
        matchedFullRecord = {
          code: matchedProject.project_code,
          title: matchedProject.title,
          description: matchedProject.description || '',
          domain: matchedProject.domain,
          status: matchedProject.status,
          priority: matchedProject.priority,
          progress: matchedProject.progress,
          due_date: matchedProject.due_date,
          immediate_action: matchedProject.immediate_action,
          github_repo: matchedProject.github_repo,
          doc_url: matchedProject.doc_url,
          team_name: matchedProject.team_name,
          team_lead: matchedProject.team_lead,
          team_members: matchedProject.team_members,
          bom_status: matchedProject.bom_status,
          boms: projBoms.map(b => ({ item: b.item_name, qty: b.quantity, price: b.total_price, status: b.status }))
        };
      }

      // Multi-Team Intents: Comparison Query Detection
      let comparisonProjects = [];
      if (q.includes('compare') || q.includes('versus') || q.includes('vs') || (q.includes('higher progress') || q.includes('lower progress') || q.includes('between'))) {
        if (scoredProjects.length >= 2 && scoredProjects[0].score >= 40 && scoredProjects[1].score >= 40) {
          comparisonProjects = [scoredProjects[0].project, scoredProjects[1].project];
        }
      }

      // Status / Filter Queries
      let statusFilterResult = null;
      if (q.includes('which team') || q.includes('which project') || q.includes('show all') || q.includes('list all')) {
        if (q.includes('completed')) {
          statusFilterResult = allProjects.filter(p => p.status === 'completed');
        } else if (q.includes('progress') || q.includes('prototyping')) {
          statusFilterResult = allProjects.filter(p => p.status === 'in_progress');
        } else if (q.includes('testing')) {
          statusFilterResult = allProjects.filter(p => p.status === 'testing');
        } else if (q.includes('queue') || q.includes('not started') || q.includes('delayed')) {
          statusFilterResult = allProjects.filter(p => p.status === 'in_queue' || (p.progress < 50 && p.status !== 'completed'));
        }
      }

      const systemPrompt = `You are iGrid Assistant, a knowledgeable project coordinator who knows every team's details well — like a helpful senior team member, not a robotic bot.

When a user mentions a project or team name, retrieve and present that project's full details in a natural, human, conversational way — organized clearly (like a quick briefing), not a wall of raw JSON and not a dry bullet dump.

Rules:
- Use ONLY the data provided below — never invent or guess details.
- Speak naturally and confidently, like someone who actually knows the project.
- If asked a broad question ('tell me about Enviora'), give a full natural summary covering deadline, status, progress, and recent comments.
- If asked a specific question ('what's Enviora's deadline'), answer that specifically and briefly in natural phrasing.
- If comparing projects, highlight progress % and status differences clearly.
- If the project/team name isn't found in the data, say so clearly and ask them to check the name.
- Don't mention being an AI, a language model, or any other chatbot/company by name.
- Keep responses conversational but direct.

User Role: ${isAdmin ? 'Lab Administrator' : 'Team Member'}
DATA: ${JSON.stringify({
  matchedProject: matchedFullRecord || null,
  comparisonProjects: comparisonProjects.map(p => ({ code: p.project_code, title: p.title, team: p.team_name, status: p.status, progress: p.progress, due: p.due_date })),
  filteredProjects: statusFilterResult ? statusFilterResult.map(p => ({ code: p.project_code, title: p.title, team: p.team_name, status: p.status, progress: p.progress })) : null,
  allProjectNames: allProjects.map(p => ({ code: p.project_code, title: p.title, team: p.team_name }))
}, null, 2)}`;

      // Construct Multi-Turn Messages Payload
      const messageHistory = Array.isArray(history) ? history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: String(h.content || '')
      })) : [];

      messageHistory.push({ role: 'user', content: message });

      // Call Anthropic Claude API if key present
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 350,
              system: systemPrompt,
              messages: messageHistory
            })
          });

          const data = await response.json();
          if (data.content && data.content[0] && data.content[0].text) {
            return res.json({ reply: data.content[0].text.trim() });
          }
        } catch (apiErr) {
          console.error('Claude API call error:', apiErr);
        }
      }

      // Direct Natural Fallback Reasoning Engine
      let reply = '';
      if (comparisonProjects.length >= 2) {
        const p1 = comparisonProjects[0];
        const p2 = comparisonProjects[1];
        reply = `Comparing **${p1.title}** (${p1.progress}% progress, Status: ${p1.status}) vs **${p2.title}** (${p2.progress}% progress, Status: ${p2.status}): ${p1.progress >= p2.progress ? `${p1.title} has higher progress.` : `${p2.title} has higher progress.`}`;
      } else if (statusFilterResult) {
        reply = `Found ${statusFilterResult.length} matching project(s):\n` + statusFilterResult.map(p => `• **${p.project_code}** (${p.title}): ${p.progress}% progress [${p.status.toUpperCase()}]`).join('\n');
      } else if (matchedFullRecord) {
        const p = matchedFullRecord;
        if (q.includes('deadline') || q.includes('due') || q.includes('date')) {
          reply = `${p.title} (${p.code}) is due on ${p.due_date || 'TBD'}.`;
        } else if (q.includes('progress') || q.includes('percent')) {
          reply = `${p.title} (${p.code}) is currently at ${p.progress}% completion.`;
        } else if (q.includes('status')) {
          reply = `${p.title} (${p.code}) status is ${p.status.toUpperCase()}.`;
        } else if (q.includes('github') || q.includes('repo')) {
          reply = p.github_repo ? `GitHub Repo for ${p.title} (${p.code}): ${p.github_repo}` : `No GitHub repository link logged for ${p.title}.`;
        } else if (q.includes('doc') || q.includes('report')) {
          reply = p.doc_url ? `Technical Report link for ${p.title} (${p.code}): ${p.doc_url}` : `No technical report link logged for ${p.title}.`;
        } else {
          reply = `${p.team_name || p.title} (${p.code}) is at ${p.progress}% progress, due ${p.due_date || 'TBD'}. Current status: ${p.status}. Immediate action: ${p.immediate_action || 'None logged'}.`;
        }
      } else {
        reply = 'Not available in your project data.';
      }

      res.json({ reply });
    });
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(`🚀 IGRID Innovation Lab PM Dashboard is running!`);
  console.log(`🌐 Local Access:   http://localhost:${PORT}`);
  console.log(`📡 Network/Docker: http://0.0.0.0:${PORT}`);
  console.log(`====================================================`);

  // Auto-connect to permanent Ngrok domain
  try {
    const ngrok = require('@ngrok/ngrok');
    const NGROK_DOMAIN = process.env.NGROK_DOMAIN || 'kabob-suspect-mandate.ngrok-free.dev';
    const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || '3Hr56NkQmK7fScedP090Ry6c8ll_78W6QjADbCB92cWhD8ZpT';
    
    console.log(`Connecting to permanent Ngrok public domain: ${NGROK_DOMAIN}...`);
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: NGROK_AUTHTOKEN,
      domain: NGROK_DOMAIN
    });
    console.log(`🎉 LIVE PUBLIC URL (PERMANENT FIXED DOMAIN): ${listener.url()}`);
    console.log(`====================================================`);
  } catch (ngrokErr) {
    console.warn(`[Ngrok Notice] ${ngrokErr.message || ngrokErr}`);
  }
});
