/**
 * seed-pdf-elite-teams.js
 * Bulk-populates SQLite database with full IGRID Elite Program projects, batches, team numbers,
 * and 76 student roster entries extracted directly from the official PDF table.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'igrid.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database at', dbPath, err.message);
    process.exit(1);
  }
});

// Domain inference helper based on title / department
function inferDomain(title, depts) {
  const t = (title || '').toLowerCase();
  if (t.includes('robot') || t.includes('cleaning') || t.includes('waste collection') || t.includes('gardening')) return 'Robotics';
  if (t.includes('drone') || t.includes('twin') || t.includes('crowd monitoring')) return 'Drones';
  if (t.includes('iot') || t.includes('switch') || t.includes('food monitoring') || t.includes('medical device')) return 'IoT';
  if (t.includes('ai') || t.includes('vision') || t.includes('attendance') || t.includes('traffic') || t.includes('analytics') || t.includes('scoring')) return 'AI';
  if (t.includes('erp') || t.includes('inventory') || t.includes('monitoring system') || t.includes('virtual') || t.includes('tour') || t.includes('dashboard')) return 'Embedded';
  return 'AI';
}

const ELITE_PROJECTS_DATA = [
  // BATCH 1
  {
    batch: 1,
    team_number: 1,
    project_code: 'IG26010001',
    title: 'Academic ERP System',
    description: 'Comprehensive academic campus enterprise resource planning platform for tracking courses, student attendance, grades, and administrative workflows.',
    members: [
      { name: 'B.Sushma', roll_no: '811224243056', department: 'AI & DS', year: '3rd Year' },
      { name: 'K. Kathir', roll_no: '811224243025', department: 'AI & DS', year: '3rd Year' },
      { name: 'R Shanmugaraja', roll_no: '811224243051', department: 'AI & DS', year: '3rd Year' }
    ]
  },
  {
    batch: 1,
    team_number: 2,
    project_code: 'IG26010002',
    title: 'Transport ERP System',
    description: 'Fleet management and campus bus routing system with real-time tracking, driver allocation, and maintenance scheduling.',
    members: [
      { name: 'A.Mathumitha', roll_no: '811224243034', department: 'AI & DS', year: '3rd Year' },
      { name: 'A.Pavithra', roll_no: '811224243038', department: 'AI & DS', year: '3rd Year' },
      { name: 'S.Pushpa', roll_no: '811224205040', department: 'IT', year: '3rd Year' }
    ]
  },
  {
    batch: 1,
    team_number: 3,
    project_code: 'IG26010003',
    title: 'AI-Based Waste Segregation System',
    description: 'Computer vision and edge AI smart bin that automatically classifies and sorts recyclables, organic waste, and non-recyclables in real time.',
    members: [
      { name: 'Dharshini Elango', roll_no: '811224243010', department: 'AI & DS', year: '3rd Year' },
      { name: 'Kamatchi S', roll_no: '811224243023', department: 'AI & DS', year: '3rd Year' },
      { name: 'Akthar barvish khan.A', roll_no: '811224104005', department: 'CSE', year: '3rd Year' },
      { name: 'V.Harish Maya', roll_no: '811224104027', department: 'CSE', year: '3rd Year' }
    ]
  },
  {
    batch: 1,
    team_number: 4,
    project_code: 'IG26010004',
    title: 'Campus Carbon Footprint Dashboard',
    description: 'Environmental analytics platform monitoring energy consumption, campus emissions, solar generation, and sustainability metrics.',
    members: [
      { name: 'Manikkavel S', roll_no: '811224243033', department: 'AI & DS', year: '3rd Year' },
      { name: 'A.Aslin', roll_no: '811223104010', department: 'CSE', year: '4th Year' },
      { name: 'L.Saranya', roll_no: '811224205050', department: 'IT', year: '2nd Year' },
      { name: 'R Anabayacholan', roll_no: '811224243003', department: 'AI & DS', year: '3rd Year' }
    ]
  },
  {
    batch: 1,
    team_number: 5,
    project_code: 'IG26010005',
    title: 'Tree Health Monitoring System',
    description: 'IoT sensor mesh and multispectral imaging node assessing tree canopy health, soil hydration, and disease presence across campus.',
    members: [
      { name: 'Gurucharan M', roll_no: '811224104024', department: 'CSE', year: '3rd Year' },
      { name: 'Sanjay Senthil', roll_no: '811224243047', department: 'AI & DS', year: '3rd Year' },
      { name: 'Ravikumar M', roll_no: '811224104069', department: 'CSE', year: '3rd Year' },
      { name: 'S.Yuvapreetha', roll_no: '811224205069', department: 'IT', year: '3rd Year' }
    ]
  },

  // BATCH 2
  {
    batch: 2,
    team_number: 6,
    project_code: 'IG26010006',
    title: 'Smart Gesture-Based IoT Switch',
    description: 'Contactless home and laboratory appliance controller using millimeter-wave radar / optical sensors and microcontrollers for gesture switching.',
    members: [
      { name: 'K. SALINI', roll_no: '811223104050', department: 'CSE', year: '4th Year' },
      { name: 'R.priyadhardhashini', roll_no: '811223104045', department: 'CSE', year: '4th Year' }
    ]
  },
  {
    batch: 2,
    team_number: 7,
    project_code: 'IG26010007',
    title: 'Inventory management',
    description: 'Real-time lab component tracking, RFID barcode check-in/out, and automated re-ordering system for engineering equipment.',
    members: [
      { name: 'S. Janani', roll_no: '811223104021', department: 'CSE', year: '4th Year' },
      { name: 'S.Nithya sri', roll_no: '811223104042', department: 'CSE', year: '4th Year' },
      { name: 'M.Harini', roll_no: '811223104017', department: 'CSE', year: '4th Year' }
    ]
  },
  {
    batch: 2,
    team_number: 8,
    project_code: 'IG26010008',
    title: 'Smart Irrigation System',
    description: 'Precision agriculture irrigation controller with soil moisture sensors, weather forecasting API integration, and automated solenoid valves.',
    members: [
      { name: 'V.Priyadharshini', roll_no: '811224243042', department: 'AI&DS', year: '3rd Year' },
      { name: 'M. Rakshana Nilofer', roll_no: '811224243043', department: 'AI&DS', year: '3rd Year' },
      { name: 'Kalaiyarasi.K', roll_no: '811224104030', department: 'CSE', year: '3rd Year' },
      { name: 'Deepika.S', roll_no: '811224104014', department: 'CSE', year: '3rd Year' },
      { name: 'Mohanapriya M', roll_no: '811224104047', department: 'CSE', year: '3rd Year' }
    ]
  },
  {
    batch: 2,
    team_number: 9,
    project_code: 'IG26010009',
    title: 'Camera-Based Attendance System',
    description: 'High-speed multi-face detection and biometric recognition system for automated lecture hall attendance logging and reporting.',
    members: [
      { name: 'R. Vanmathi', roll_no: '811223104058', department: 'CSE', year: '4th Year' },
      { name: 'S.Nirmal sri', roll_no: '811223104040', department: 'CSE', year: '4th Year' },
      { name: 'Kuzhali M', roll_no: '811223104026', department: 'CSE', year: '4th Year' }
    ]
  },
  {
    batch: 2,
    team_number: 10,
    project_code: 'IG26010010',
    title: 'Placement Readiness Scoring System',
    description: 'Machine learning scoring engine analyzing coding aptitude, communication skills, project portfolio, and mock interviews for career placement.',
    members: [
      { name: 'Saran Kumar ERP', roll_no: '811224243048', department: 'AI & DS', year: '3rd Year' },
      { name: 'Monika.S', roll_no: '811223104036', department: 'CSE', year: '3rd Year' },
      { name: 'G.M.Nirmala', roll_no: '811223104039', department: 'CSE', year: '3rd Year' },
      { name: 'Abi Angelin A', roll_no: '811224104002', department: 'CSE', year: '3rd Year' },
      { name: 'Mohanapriya S', roll_no: '811224104048', department: 'CSE', year: '3rd Year' }
    ]
  },

  // BATCH 3
  {
    batch: 3,
    team_number: 11,
    project_code: 'IG26010011',
    title: 'Autonomous Floor Cleaning Robot',
    description: 'ROS2 and LiDAR-powered autonomous indoor sanitation robot with SLAM path planning, ultrasonic bump sensors, and vacuum scrubber mechanism.',
    members: [
      { name: 'Roshan P', roll_no: '811224243045', department: 'AI & DS', year: '3rd Year' },
      { name: 'V.J.Yogesh', roll_no: '811224243062', department: 'AI & DS', year: '3rd Year' },
      { name: 'SWETHA.R', roll_no: '811224205056', department: 'IT', year: '3rd Year' },
      { name: 'Janani sundar', roll_no: '811223104020', department: 'CSE', year: '4th Year' }
    ]
  },
  {
    batch: 3,
    team_number: 12,
    project_code: 'IG26010012',
    title: 'Robotic Waste Collection System',
    description: 'Tracked mobile chassis robot equipped with robotic arm gripper and optical object recognition to navigate corridors and retrieve trash.',
    members: [
      { name: 'SANKAR.S', roll_no: '811224114013', department: 'Mech', year: '3rd Year' },
      { name: 'SAMU.A', roll_no: '811224114012', department: 'Mech', year: '3rd Year' },
      { name: 'Lavanya kumaresan', roll_no: '811223104027', department: 'CSE', year: '4th Year' },
      { name: 'Madhumitha Senthilkumar', roll_no: '811223104030', department: 'CSE', year: '4th Year' }
    ]
  },
  {
    batch: 3,
    team_number: 13,
    project_code: 'IG26010013',
    title: 'Robotic Gardening System',
    description: 'Automated greenhouse robotic gantry and manipulator providing soil aerating, selective weeding, targeted watering, and plant health diagnostics.',
    members: [
      { name: 'V.Susithra', roll_no: '811224243057', department: 'AI&DS', year: '3rd Year' },
      { name: 'M.Sheeba Catherine', roll_no: '811224243054', department: 'AI&DS', year: '3rd Year' },
      { name: 'M.Abipriya', roll_no: '811224243001', department: 'AI&DS', year: '3rd Year' },
      { name: 'Boris Roger A', roll_no: '811224243006', department: 'AI & DS', year: '3rd Year' }
    ]
  },
  {
    batch: 3,
    team_number: 14,
    project_code: 'IG26010014',
    title: 'project monitoring system',
    description: 'Centralized engineering lab project management dashboard with real-time Gantt tracking, BOM procurement pipelines, and student progress reports.',
    members: [
      { name: 'Abinaya', roll_no: '811223104002', department: 'CSE', year: '4th Year' },
      { name: 'A.Kaviya', roll_no: '811224243026', department: 'AI&DS', year: '3rd Year' },
      { name: 'A. Jemima', roll_no: '811224243021', department: 'AI&DS', year: '3rd Year' },
      { name: 'P. Lathika', roll_no: '811224243030', department: 'AI&DS', year: '3rd Year' },
      { name: 'V.Priyadharshini', roll_no: '811224243042', department: 'AI&DS', year: '3rd Year' },
      { name: 'M. Rakshana Nilofer', roll_no: '811224243043', department: 'AI&DS', year: '3rd Year' }
    ]
  },
  {
    batch: 3,
    team_number: 15,
    project_code: 'IG26010015',
    title: 'Virtual Campus Tour',
    description: 'Interactive 360-degree virtual tour and augmented reality campus navigation platform for visitors, prospective students, and incoming faculty.',
    members: [
      { name: 'B. Haribala', roll_no: '811225114006', department: 'Mech', year: '2nd Year' },
      { name: 'Jones malaravan A', roll_no: '811225114008', department: 'MECH', year: '2nd Year' },
      { name: 'KRISHNA KUMAR.S', roll_no: '811224114007', department: 'Mech', year: '3rd Year' },
      { name: 'M.Abinaya', roll_no: '811224205002', department: 'IT', year: '3rd Year' }
    ]
  },

  // BATCH 4
  {
    batch: 4,
    team_number: 16,
    project_code: 'IG26010016',
    title: 'Vehicle Entry & Traffic Analytics',
    description: 'Automated License Plate Recognition (ALPR) camera gatekeeper with vehicle velocity estimation and campus parking occupancy telemetry.',
    members: [
      { name: 'R.Banupriya', roll_no: '811224104010', department: 'CSE', year: '3rd Year' },
      { name: 'C.Dharshini', roll_no: '811224104015', department: 'CSE', year: '3rd Year' },
      { name: 'V.Dharshini', roll_no: '811224104016', department: 'CSE', year: '3rd Year' },
      { name: 'B.Arasi', roll_no: '811224104006', department: 'CSE', year: '3rd Year' }
    ]
  },
  {
    batch: 4,
    team_number: 17,
    project_code: 'IG26010017',
    title: 'Drone Crowd Monitoring System',
    description: 'Aerial quadcopter surveillance system with onboard computer vision for crowd density heatmaps, safety bottleneck detection, and event security.',
    members: [
      { name: 'Bharathi S', roll_no: '811224121005', department: 'BME', year: '3rd Year' },
      { name: 'Indhumathi S', roll_no: '811224121018', department: 'BME', year: '3rd Year' },
      { name: 'K Afraa', roll_no: '811224121001', department: 'BME', year: '3rd Year' },
      { name: 'Y Monica', roll_no: '811224243036', department: 'AI & DS', year: '3rd Year' }
    ]
  },
  {
    batch: 4,
    team_number: 18,
    project_code: 'IG26010018',
    title: 'Drone Digital Twin Data Capture System',
    description: 'Photogrammetry and LiDAR aerial scanning payload delivering dense 3D point clouds and real-time BIM digital twins of college infrastructure.',
    members: [
      { name: 'P.Kishore Dharshan', roll_no: '811223104025', department: 'CSE', year: '4th Year' },
      { name: 'S.kiruthiga', roll_no: '811223104023', department: 'CSE', year: '4th Year' },
      { name: 'DHARSHINI S', roll_no: '811224243011', department: 'AI & DS', year: '3rd Year' },
      { name: 'Thomson jeffery X', roll_no: '811224114304', department: 'Mech', year: '3rd Year' }
    ]
  },
  {
    batch: 4,
    team_number: 19,
    project_code: 'IG26010019',
    title: 'Smart Medical Device Prototype',
    description: 'Non-invasive continuous patient vital signs monitor measuring SpO2, ECG waveforms, and core temperature with Bluetooth low-energy telemetry.',
    members: [
      { name: 'G.Birundha', roll_no: '811224121006', department: 'BME', year: '3rd Year' },
      { name: 'Hemalatha V', roll_no: '811224121017', department: 'BME', year: '3rd Year' },
      { name: 'Renugadevi S', roll_no: '811224121035', department: 'BME', year: '3rd Year' },
      { name: 'INDHUMATHI J', roll_no: '811223121018', department: 'BME', year: '4th Year' }
    ]
  },
  {
    batch: 4,
    team_number: 20,
    project_code: 'IG26010020',
    title: 'Smart Food Monitoring Device',
    description: 'Smart refrigerator and pantry sensor array tracking food freshness, volatile organic gas emissions, and cold-chain temperature thresholds.',
    members: [
      { name: 'T.Sathya', roll_no: '811223104053', department: 'CSE', year: '4th Year' },
      { name: 'K.Ajay', roll_no: '811223104004', department: 'CSE', year: '4th Year' }
    ]
  }
];

// Helper colors and avatar generators for students
const AVATAR_COLORS = ['#ec4899', '#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#ef4444', '#84cc16'];
function getInitials(name) {
  const parts = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.substring(0, 2) || 'ST').toUpperCase();
}

async function runSeed() {
  console.log('🚀 Starting IGRID Elite Program PDF bulk population & sync...');

  // Ensure migrations
  await new Promise((resolve) => {
    db.run(`ALTER TABLE projects ADD COLUMN batch INTEGER DEFAULT 1`, () => resolve());
  });
  await new Promise((resolve) => {
    db.run(`ALTER TABLE projects ADD COLUMN team_number INTEGER`, () => resolve());
  });
  await new Promise((resolve) => {
    db.run(`ALTER TABLE projects ADD COLUMN team_members TEXT`, () => resolve());
  });
  await new Promise((resolve) => {
    db.run(`ALTER TABLE projects ADD COLUMN team_logo_url TEXT`, () => resolve());
  });

  let projectsUpdated = 0;
  let projectsCreated = 0;
  let studentsUpdated = 0;
  let studentsCreated = 0;
  const flaggedAmbiguities = [];

  // Track occurrences of roll numbers to flag duplicate assignments
  const rollAssignments = {};

  for (const proj of ELITE_PROJECTS_DATA) {
    const memberNames = proj.members.map(m => m.name);
    const memberJson = JSON.stringify(memberNames);
    const leadName = memberNames[0] || '';
    const teamTitle = `Team ${proj.team_number}`;
    const domain = inferDomain(proj.title, proj.members.map(m => m.department));

    // Check if project exists by project_code
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE project_code = ?', [proj.project_code], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (existing) {
      // UPDATE existing project without altering existing status, progress, dates, links
      await new Promise((resolve, reject) => {
        const sql = `
          UPDATE projects SET
            title = COALESCE(NULLIF(title, ''), ?),
            team_members = ?,
            batch = ?,
            team_number = ?,
            team_name = COALESCE(NULLIF(team_name, ''), ?),
            team_lead = COALESCE(NULLIF(team_lead, ''), ?),
            updated_at = CURRENT_TIMESTAMP
          WHERE project_code = ?
        `;
        db.run(sql, [proj.title, memberJson, proj.batch, proj.team_number, teamTitle, leadName, proj.project_code], function(err) {
          if (err) return reject(err);
          resolve();
        });
      });
      projectsUpdated++;
      console.log(`  [UPDATE] Project ${proj.project_code} ("${existing.title}"): Updated members (${memberNames.length}), Batch ${proj.batch}, Team ${proj.team_number}`);
    } else {
      // INSERT new project
      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO projects (
            project_code, title, description, domain, tags, status, priority,
            progress, start_date, due_date, immediate_action, github_repo,
            youtube_url, linkedin_url, doc_url, image_url,
            bom_status, team_name, team_lead, team_lead_photo, team_logo_url, team_members, deliverables,
            batch, team_number, is_active, is_visible
          ) VALUES (?, ?, ?, ?, ?, 'in_queue', 'Normal', 0, '', '', '', '', '', '', '', '', 'Not Required', ?, ?, '', '', ?, '', ?, ?, 1, 1)
        `;
        const tags = `#Batch${proj.batch},#Team${proj.team_number},#${domain},#IGRID`;
        db.run(sql, [
          proj.project_code, proj.title, proj.description, domain, tags,
          teamTitle, leadName, memberJson, proj.batch, proj.team_number
        ], function(err) {
          if (err) return reject(err);
          resolve();
        });
      });
      projectsCreated++;
      console.log(`  [CREATE] Project ${proj.project_code} ("${proj.title}"): Created with members (${memberNames.length}), Batch ${proj.batch}, Team ${proj.team_number}`);
    }

    // Process students for this project
    for (let i = 0; i < proj.members.length; i++) {
      const s = proj.members[i];
      const isLead = (i === 0);
      const role = isLead ? 'Team Lead' : 'Team Member';
      const initials = getInitials(s.name);
      const color = AVATAR_COLORS[(proj.team_number + i) % AVATAR_COLORS.length];

      // Track duplicate assignments
      if (!rollAssignments[s.roll_no]) {
        rollAssignments[s.roll_no] = [];
      }
      rollAssignments[s.roll_no].push({
        name: s.name,
        team_number: proj.team_number,
        project_code: proj.project_code,
        project_title: proj.title
      });

      // Check student in database
      const existingStudent = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM students WHERE roll_no = ?', [s.roll_no], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

      if (existingStudent) {
        await new Promise((resolve, reject) => {
          const sql = `
            UPDATE students SET
              name = ?,
              department = ?,
              year = ?,
              assigned_project = COALESCE(NULLIF(assigned_project, ''), ?),
              project_title = COALESCE(NULLIF(project_title, ''), ?),
              team_members = ?,
              role = COALESCE(NULLIF(role, ''), ?)
            WHERE roll_no = ?
          `;
          db.run(sql, [s.name, s.department, s.year, proj.project_code, proj.title, memberJson, role, s.roll_no], function(err) {
            if (err) return reject(err);
            resolve();
          });
        });
        studentsUpdated++;
      } else {
        await new Promise((resolve, reject) => {
          const cleanEmail = `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}${s.roll_no.slice(-4)}@igridlab.edu.in`;
          const sql = `
            INSERT INTO students (
              name, roll_no, email, department, year, role, skills,
              avatar_color, avatar_initials, assigned_project, project_title,
              team_members, status, progress, college
            ) VALUES (?, ?, ?, ?, ?, ?, 'Project Development', ?, ?, ?, ?, ?, 'Active', 0, 'Indra Ganesan College of Engineering')
          `;
          db.run(sql, [
            s.name, s.roll_no, cleanEmail, s.department, s.year, role,
            color, initials, proj.project_code, proj.title, memberJson
          ], function(err) {
            if (err) return reject(err);
            resolve();
          });
        });
        studentsCreated++;
      }
    }
  }

  // Detect and summarize flagged duplicate assignments
  for (const [roll, occurrences] of Object.entries(rollAssignments)) {
    if (occurrences.length > 1) {
      flaggedAmbiguities.push({
        roll_no: roll,
        name: occurrences[0].name,
        occurrences: occurrences.map(o => `Team ${o.team_number} (${o.project_code}: ${o.project_title})`)
      });
    }
  }

  console.log('\n======================================================');
  console.log('🎉 IGRID ELITE PROGRAM BULK IMPORT SUMMARY');
  console.log('======================================================');
  console.log(`✅ Total Projects Processed: ${ELITE_PROJECTS_DATA.length}`);
  console.log(`   - Projects Updated (Existing): ${projectsUpdated}`);
  console.log(`   - Projects Created (New):      ${projectsCreated}`);
  console.log(`✅ Total Student Records Processed: ${studentsUpdated + studentsCreated} rows (${Object.keys(rollAssignments).length} unique roll numbers)`);
  console.log(`   - Students Updated (Existing): ${studentsUpdated}`);
  console.log(`   - Students Created (New):      ${studentsCreated}`);

  if (flaggedAmbiguities.length > 0) {
    console.log('\n⚠️  FLAGGED AMBIGUITIES / DUPLICATE ASSIGNMENTS IN PDF:');
    flaggedAmbiguities.forEach((fa, idx) => {
      console.log(`   ${idx + 1}. Student: ${fa.name} (Reg No: ${fa.roll_no})`);
      console.log(`      Assigned in PDF to multiple teams:`);
      fa.occurrences.forEach(occ => console.log(`        - ${occ}`));
    });
  }
  console.log('======================================================\n');

  db.close();
}

runSeed().catch(err => {
  console.error('❌ Error executing seed script:', err);
  process.exit(1);
});
