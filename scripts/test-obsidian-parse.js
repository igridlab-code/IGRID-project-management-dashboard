const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const obsidianDir = 'C:\\Users\\user\\Downloads\\IGRID Elite Projects\\IGRID Elite Projects';
const projectsDir = path.join(obsidianDir, '01 - Projects');
const teamsDir = path.join(obsidianDir, '02 - Teams');
const dbPath = path.join(__dirname, '..', 'data', 'igrid.db');

console.log('Database path:', dbPath);
console.log('Obsidian projects directory:', projectsDir);

if (!fs.existsSync(projectsDir)) {
  console.error('Projects directory does not exist:', projectsDir);
  process.exit(1);
}

const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md')).sort();
console.log(`Found ${files.length} project files in Obsidian vault.`);

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

  // Parse sections in markdown body
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
    // Skip header and separator rows
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
    raw,
    frontmatter,
    students,
    overview,
    currentWork,
    challenges,
    supportRequired,
    nextAction
  };
}

const parsedProjects = files.map(f => {
  const p = parseProjectFile(path.join(projectsDir, f));
  return {
    file: f,
    ...p
  };
});

console.log('Successfully parsed', parsedProjects.length, 'projects.');
parsedProjects.forEach(p => {
  console.log(`[Project ${p.frontmatter.project_id || '??'}] ${p.frontmatter.project_name} | Progress: ${p.frontmatter.completion}% | Status: ${p.frontmatter.status} | Students: ${p.students.length}`);
});
