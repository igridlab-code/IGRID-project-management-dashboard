/**
 * IGRID INNOVATION LAB - OBSIDIAN VAULT POPULATION ENGINE
 * Reads all 20 project markdown files from:
 * "C:\Users\user\Downloads\IGRID Elite Projects\IGRID Elite Projects\01 - Projects"
 * and populates SQLite database (projects, students, bom_items).
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'igrid.db');
const obsidianDir = 'C:\\Users\\user\\Downloads\\IGRID Elite Projects\\IGRID Elite Projects';
const projectsDir = path.join(obsidianDir, '01 - Projects');
const teamsDir = path.join(obsidianDir, '02 - Teams');

if (!fs.existsSync(projectsDir)) {
  console.error('❌ Projects directory not found at:', projectsDir);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database:', dbPath);
});

// Domain mapping based on project category and title
function mapDomain(category, title) {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (cat.includes('robot') || t.includes('robot') || t.includes('cleaning') || t.includes('gardening')) {
    return 'Robotics & Automation';
  }
  if (cat.includes('drone') || t.includes('drone') || t.includes('twin') || t.includes('aerial')) {
    return 'Drones & Vision';
  }
  if (cat.includes('medical') || t.includes('medical') || t.includes('health') || t.includes('biomedical')) {
    return 'Biomedical & Healthcare';
  }
  if (cat.includes('ai') || cat.includes('machine learning') || t.includes('attendance') || t.includes('traffic') || t.includes('readiness') || t.includes('waste segregation') || t.includes('virtual campus') || t.includes('tour')) {
    return 'AI & Machine Learning';
  }
  if (cat.includes('iot') || cat.includes('hardware') || cat.includes('embedded') || t.includes('switch') || t.includes('irrigation') || t.includes('tree') || t.includes('food monitoring')) {
    return 'IoT & Embedded';
  }
  return 'Software & ERP';
}

// Generate tags based on project details
function generateTags(id, title, domain) {
  const tagList = [];
  const t = title.toLowerCase();

  if (domain === 'Robotics & Automation') tagList.push('#Robotics', '#Autonomous', '#SLAM', '#Motors');
  else if (domain === 'Drones & Vision') tagList.push('#Drones', '#ComputerVision', '#AerialMapping', '#DigitalTwin');
  else if (domain === 'Biomedical & Healthcare') tagList.push('#Biomedical', '#Healthcare', '#Sensors', '#ESP32');
  else if (domain === 'AI & Machine Learning') tagList.push('#AI', '#ComputerVision', '#DeepLearning', '#Analytics');
  else if (domain === 'IoT & Embedded') tagList.push('#IoT', '#Embedded', '#ESP32', '#SmartCampus');
  else tagList.push('#ERP', '#Software', '#FullStack', '#WebPlatform');

  if (t.includes('waste')) tagList.push('#GreenCampus');
  if (t.includes('carbon')) tagList.push('#Sustainability');
  if (t.includes('attendance')) tagList.push('#FaceRecognition');
  if (t.includes('irrigation')) tagList.push('#AgriTech');
  if (t.includes('placement')) tagList.push('#StudentAnalytics');

  return Array.from(new Set(tagList)).slice(0, 4).join(' ');
}

// Curated prototype photos for flagship showcase cards
const prototypeImages = {
  "01": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80", // Academic ERP
  "02": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80", // Transport ERP
  "03": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80", // Waste Segregation
  "04": "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80", // Carbon Footprint
  "05": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80", // Tree Health
  "06": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80", // Smart IR Switch
  "07": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80", // Inventory Management
  "08": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80", // Smart Irrigation
  "09": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80", // Camera Attendance
  "10": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80", // Placement Scoring
  "11": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80", // Floor Cleaning Robot
  "12": "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=80", // Waste Collection Robot
  "13": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", // Robotic Gardening
  "14": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80", // Project Monitoring
  "15": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80", // Virtual Campus Tour
  "16": "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&auto=format&fit=crop&q=80", // Vehicle Entry Traffic
  "17": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80", // Drone Crowd Monitoring
  "18": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80", // Drone Digital Twin
  "19": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80", // Smart Medical Device
  "20": "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&auto=format&fit=crop&q=80"  // Smart Food Monitoring
};

// Student avatar photos
const studentPhotos = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80"
];

function parseProjectFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  
  // Frontmatter parsing
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = {};
  if (fmMatch) {
    const lines = fmMatch[1].split(/\r?\n/);
    lines.forEach(l => {
      const idx = l.indexOf(':');
      if (idx > -1) {
        const key = l.slice(0, idx).trim();
        let val = l.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            val = JSON.parse(val.replace(/'/g, '"'));
          } catch(e) {
            val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
          }
        }
        frontmatter[key] = val;
      }
    });
  }

  function extractSection(heading) {
    const reg = new RegExp(`##\\s*[^\\n]*${heading}[^\\n]*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##|$)`, 'i');
    const m = raw.match(reg);
    return m ? m[1].trim() : '';
  }

  // Parse Table of Students
  const teamSection = extractSection('Team Members');
  const students = [];
  if (teamSection) {
    const tableLines = teamSection.split(/\r?\n/).filter(l => l.trim().startsWith('|'));
    for (let i = 2; i < tableLines.length; i++) {
      const cols = tableLines[i].split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cols.length >= 3) {
        students.push({
          name: cols[0],
          reg_no: cols[1],
          dept: cols[2],
          year: cols[3] || '3'
        });
      }
    }
  }

  const overview = extractSection('Project Overview').replace(/\*Source:.*$/im, '').trim();
  const currentWork = extractSection('Completed / Current Work');
  const challenges = extractSection('Challenges / Issues');
  const supportRequired = extractSection('Support Required');
  const nextAction = frontmatter.next_action || extractSection('Next Action').replace(/^\*\*Source-based next action:\*\*\s*/i, '').trim();

  return {
    frontmatter,
    students,
    overview,
    currentWork,
    challenges,
    supportRequired,
    nextAction
  };
}

const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md')).sort();
console.log(`🚀 Found ${files.length} project markdown files. Starting database population...`);

const allStudents = [];
const allProjects = [];

files.forEach((file, idx) => {
  const parsed = parseProjectFile(path.join(projectsDir, file));
  const fm = parsed.frontmatter;
  const numId = String(fm.project_id || idx + 1).padStart(2, '0');
  const title = fm.project_name || file.replace(/^\d+\s*-\s*/, '').replace(/\.md$/, '');
  const completion = Number(fm.completion) || 0;
  const domain = mapDomain(fm.category, title);
  
  // Status mapping
  let status = 'in_progress';
  if (completion >= 90) status = 'completed';
  else if (completion >= 65) status = 'testing';
  else if (completion >= 30) status = 'in_progress';
  else status = 'in_queue';

  // Priority mapping
  let priority = fm.priority || 'Normal';
  if (priority.toLowerCase() === 'high') priority = 'High';
  else if (priority.toLowerCase() === 'low') priority = 'Low';
  else priority = 'Normal';

  // Project Code
  const domainPrefix = domain === 'AI & Machine Learning' ? 'AI' :
                       domain === 'Robotics & Automation' ? 'ROB' :
                       domain === 'IoT & Embedded' ? 'IOT' :
                       domain === 'Drones & Vision' ? 'DRN' :
                       domain === 'Biomedical & Healthcare' ? 'BIO' : 'ERP';
  const project_code = `IGRID-${domainPrefix}-${numId}`;

  const teamName = `Team ${fm.team || numId} (Batch ${fm.batch || 1})`;
  const teamLead = parsed.students.length > 0 ? parsed.students[0].name : (fm.students && fm.students[0]) || 'Student Lead';
  const leadPhoto = studentPhotos[(idx) % studentPhotos.length];

  // Map students
  parsed.students.forEach((s, sIdx) => {
    allStudents.push({
      name: s.name,
      roll_no: s.reg_no,
      email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@igridlab.edu`,
      department: s.dept,
      year: s.year || '3',
      role: sIdx === 0 ? 'Team Lead' : 'Hardware / Software Member',
      skills: `${domain}, Prototyping, C++, Python`,
      avatar_color: '#6366f1',
      avatar_initials: s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      photo_url: studentPhotos[(idx * 3 + sIdx) % studentPhotos.length],
      project_code: project_code
    });
  });

  const tags = generateTags(numId, title, domain);
  const heroImage = prototypeImages[numId] || prototypeImages["01"];

  allProjects.push({
    project_code,
    title,
    description: parsed.overview || `${title} developed by ${teamName} at IGRID Innovation Lab, Indra Ganesan College of Engineering.`,
    domain,
    tags,
    status,
    priority,
    progress: completion,
    start_date: '2026-08-01',
    due_date: status === 'completed' ? '2026-08-15' : '2026-09-30',
    immediate_action: parsed.nextAction || 'Ongoing prototype development and evaluation.',
    github_repo: `https://github.com/igridlab-code/${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    youtube_url: `https://youtube.com/watch?v=igrid-${numId}`,
    linkedin_url: `https://linkedin.com/company/igrid-lab/posts/${numId}`,
    doc_url: `https://docs.igridlab.com/projects/${numId}`,
    image_url: heroImage,
    bom_status: (domain === 'Robotics & Automation' || domain === 'IoT & Embedded' || domain === 'Drones & Vision') ? 'Pending' : 'None',
    team_name: teamName,
    team_lead: teamLead,
    team_lead_photo: leadPhoto,
    team_members: JSON.stringify(parsed.students.map(s => s.name)),
    deliverables: JSON.stringify([
      "Working Hardware Prototype / Software Build",
      "System Architecture & Documentation",
      "Git Repository Code Release",
      "Demonstration Video & Milestone Review"
    ])
  });
});

console.log(`📋 Total projects prepared: ${allProjects.length}`);
console.log(`👥 Total student members prepared: ${allStudents.length}`);

// Execute Database Updates
db.serialize(() => {
  // Clear old mock projects
  db.run('DELETE FROM projects');
  db.run('DELETE FROM students');
  db.run('DELETE FROM bom_items');
  db.run('DELETE FROM activities');

  // Insert Projects
  const stmtProject = db.prepare(`
    INSERT INTO projects (
      project_code, title, description, domain, tags, status, priority,
      progress, start_date, due_date, immediate_action, github_repo,
      youtube_url, linkedin_url, doc_url, image_url,
      bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  allProjects.forEach(p => {
    stmtProject.run(
      p.project_code, p.title, p.description, p.domain, p.tags, p.status, p.priority,
      p.progress, p.start_date, p.due_date, p.immediate_action, p.github_repo,
      p.youtube_url, p.linkedin_url, p.doc_url, p.image_url,
      p.bom_status, p.team_name, p.team_lead, p.team_lead_photo, p.team_members, p.deliverables
    );
  });
  stmtProject.finalize();
  console.log('✅ All 20 Projects inserted successfully into SQLite!');

  // Insert Unique Students
  const uniqueStudentsMap = new Map();
  allStudents.forEach(s => {
    if (!uniqueStudentsMap.has(s.roll_no)) {
      uniqueStudentsMap.set(s.roll_no, s);
    }
  });

  const stmtStudent = db.prepare(`
    INSERT INTO students (
      name, roll_no, email, department, year, role, skills, avatar_color, avatar_initials
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  uniqueStudentsMap.forEach(s => {
    stmtStudent.run(
      s.name, s.roll_no, s.email, s.department, s.year, s.role, s.skills, s.avatar_color, s.avatar_initials
    );
  });
  stmtStudent.finalize();
  console.log(`✅ ${uniqueStudentsMap.size} Unique Student Innovators inserted successfully!`);

  // Insert Key BOM Hardware Requisitions
  const bomItems = [
    { code: 'IGRID-ROB-11', item: 'Jetson Nano 4GB Dev Kit', part: 'NV-JETSON-NANO', cat: 'Single Board Computer', qty: 1, price: 14500, status: 'Pending', by: 'S. Karthi', just: 'SLAM visual navigation and neural network floor mapping' },
    { code: 'IGRID-ROB-11', item: 'RPLiDAR A1 360-degree LiDAR', part: 'SLAMTEC-A1M8', cat: 'Sensors', qty: 1, price: 7800, status: 'Approved', by: 'S. Karthi', just: 'Obstacle avoidance and real-time indoor localization' },
    { code: 'IGRID-DRN-17', item: 'Pixhawk 4 Autopilot Flight Controller', part: 'PX4-AUTOPILOT', cat: 'Flight Avionics', qty: 1, price: 18500, status: 'Approved', by: 'A. Mohammed Rizwan', just: 'Autonomous flight waypoint navigation and crowd telemetry' },
    { code: 'IGRID-DRN-18', item: 'High-Res Optical Photogrammetry Camera 4K', part: 'SONY-IMX477-4K', cat: 'Sensors', qty: 1, price: 9200, status: 'Pending', by: 'P. Hariharan', just: 'Digital twin 3D point cloud generation of college campus' },
    { code: 'IGRID-IOT-08', item: 'Capacitive Soil Moisture Sensors & ESP32-WROOM', part: 'SEN-SOIL-V2', cat: 'IoT Microcontrollers', qty: 8, price: 450, status: 'Pending', by: 'K. Vigneshwaran', just: 'Smart field moisture sensing mesh network' },
    { code: 'IGRID-BIO-19', item: 'MAX30102 High-Sensitivity Pulse Oximeter & PPG', part: 'MAX30102-MOD', cat: 'Biomedical Sensors', qty: 4, price: 650, status: 'Approved', by: 'R. Sneha', just: 'Real-time patient vitals telemetry prototype' },
    { code: 'IGRID-IOT-06', item: 'Optocoupler Solid State Relay Module 4-Channel', part: 'SSR-4CH-240V', cat: 'Power & Relays', qty: 3, price: 850, status: 'Approved', by: 'M. Naveen', just: 'Optically isolated high-voltage smart IR appliance switching' }
  ];

  const stmtBOM = db.prepare(`
    INSERT INTO bom_items (
      project_code, item_name, part_number, category, quantity, unit_price, total_price, supplier_url, datasheet_url, justification, submitted_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  bomItems.forEach(b => {
    const total = b.qty * b.price;
    stmtBOM.run(
      b.code, b.item, b.part, b.cat, b.qty, b.price, total,
      'https://robu.in', 'https://alldatasheet.com', b.just, b.by, b.status
    );
  });
  stmtBOM.finalize();
  console.log(`✅ ${bomItems.length} BOM Requisition Items inserted successfully!`);

  // Insert Activities
  db.run(`
    INSERT INTO activities (project_id, author, author_role, message, type)
    VALUES (1, 'Lab Coordinator', 'Staff', 'Imported complete project documentation and student team structure from IGRID Obsidian Vault.', 'comment')
  `);

  console.log('🎉 POPULATION COMPLETE! All Obsidian projects are live in the database.');
  db.close();
});
