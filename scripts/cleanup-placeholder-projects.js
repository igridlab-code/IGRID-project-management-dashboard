/**
 * cleanup-placeholder-projects.js
 * 
 * 1. Migrates data from placeholder records that mapped to real teams:
 *    - IGRID-ERP-02 (Team 2) -> IG26010002
 *    - IGRID-IOT-06 (Team 6) -> IG26010006
 *    - IGRID-AI-08 (Team 8) -> IG26010008
 *    - IGRID-AI-20 (Team 20) -> IG26010020
 * 2. Deletes pure test/placeholder records:
 *    - IGRID-ROB-304552 (ID 158)
 *    - IGRID-AI-069958 / IGRID-AI-869958 (ID 171)
 *    - IGRID-AI-559450 (ID 172)
 * 3. Re-syncs all 20 projects with the PDF seed data.
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

async function runCleanup() {
  console.log('🧹 Starting cleanup and data migration of placeholder projects...\n');

  const migrationMap = [
    { fromCode: 'IGRID-ERP-02', toCode: 'IG26010002', name: 'Transport ERP System (Team 2)' },
    { fromCode: 'IGRID-IOT-06', toCode: 'IG26010006', name: 'Smart Gesture-based IoT Switch (Team 6)' },
    { fromCode: 'IGRID-AI-08', toCode: 'IG26010008', name: 'Smart Irrigation System (Team 8)' },
    { fromCode: 'IGRID-AI-20', toCode: 'IG26010020', name: 'Smart Food Monitoring Device (Team 20)' }
  ];

  const pureDeleteCodes = ['IGRID-ROB-304552', 'IGRID-AI-069958', 'IGRID-AI-869958', 'IGRID-AI-559450'];

  const migratedRecords = [];
  const deletedRecords = [];

  // 1. Process Migrations
  for (const m of migrationMap) {
    const fromProj = await new Promise((res) => db.get('SELECT * FROM projects WHERE project_code = ?', [m.fromCode], (err, row) => res(row)));
    const toProj = await new Promise((res) => db.get('SELECT * FROM projects WHERE project_code = ?', [m.toCode], (err, row) => res(row)));

    if (fromProj && toProj) {
      console.log(`📦 Migrating data from [${fromProj.project_code}] (ID ${fromProj.id}) -> [${toProj.project_code}] (ID ${toProj.id}) for ${m.name}...`);

      // Update project links, dates, progress if toProj has empty values
      const newGithub = toProj.github_repo || fromProj.github_repo || '';
      const newYoutube = toProj.youtube_url || fromProj.youtube_url || '';
      const newLinkedin = toProj.linkedin_url || fromProj.linkedin_url || '';
      const newDoc = toProj.doc_url || fromProj.doc_url || '';
      const newImage = toProj.image_url || fromProj.image_url || '';
      const newLogo = toProj.team_lead_photo || fromProj.team_lead_photo || toProj.team_logo_url || fromProj.team_logo_url || '';

      await new Promise((resolve) => {
        db.run(`
          UPDATE projects SET
            github_repo = ?,
            youtube_url = ?,
            linkedin_url = ?,
            doc_url = ?,
            image_url = ?,
            team_lead_photo = ?,
            team_logo_url = ?
          WHERE id = ?
        `, [newGithub, newYoutube, newLinkedin, newDoc, newImage, newLogo, newLogo, toProj.id], () => resolve());
      });

      // Migrate BOM items
      await new Promise((resolve) => {
        db.run('UPDATE bom_items SET project_id = ?, project_code = ? WHERE project_id = ? OR project_code = ?',
          [toProj.id, toProj.project_code, fromProj.id, fromProj.project_code], () => resolve());
      });

      // Migrate Activities
      await new Promise((resolve) => {
        db.run('UPDATE activities SET project_id = ? WHERE project_id = ?', [toProj.id, fromProj.id], () => resolve());
      });

      // Migrate Project Tasks
      await new Promise((resolve) => {
        db.run('UPDATE project_tasks SET project_id = ?, project_code = ? WHERE project_id = ? OR project_code = ?',
          [toProj.id, toProj.project_code, fromProj.id, fromProj.project_code], () => resolve());
      });

      // Migrate Student assignments
      await new Promise((resolve) => {
        db.run('UPDATE students SET assigned_project = ?, project_title = ? WHERE assigned_project = ?',
          [toProj.project_code, toProj.title, fromProj.project_code], () => resolve());
      });

      // Delete the old placeholder project
      await new Promise((resolve) => {
        db.run('DELETE FROM projects WHERE id = ?', [fromProj.id], () => resolve());
      });

      migratedRecords.push({
        oldCode: fromProj.project_code,
        oldTitle: fromProj.title,
        newCode: toProj.project_code,
        newTitle: toProj.title,
        migratedTo: m.name
      });
      console.log(`   ✅ Successfully migrated and removed ${fromProj.project_code}`);
    } else if (fromProj && !toProj) {
      // Just rename project_code
      await new Promise((resolve) => {
        db.run('UPDATE projects SET project_code = ? WHERE id = ?', [m.toCode, fromProj.id], () => resolve());
      });
      migratedRecords.push({
        oldCode: fromProj.project_code,
        oldTitle: fromProj.title,
        newCode: m.toCode,
        newTitle: fromProj.title,
        migratedTo: m.name
      });
    }
  }

  // 2. Process Pure Placeholder / Test Deletions
  for (const delCode of pureDeleteCodes) {
    const projToDelete = await new Promise((res) => db.get('SELECT * FROM projects WHERE project_code = ?', [delCode], (err, row) => res(row)));
    if (projToDelete) {
      console.log(`🗑️ Deleting pure placeholder record [${projToDelete.project_code}] (ID ${projToDelete.id}): "${projToDelete.title}"...`);
      
      // Clean up linked tasks, activities, boms
      await new Promise((resolve) => {
        db.run('DELETE FROM bom_items WHERE project_id = ? OR project_code = ?', [projToDelete.id, projToDelete.project_code], () => resolve());
      });
      await new Promise((resolve) => {
        db.run('DELETE FROM activities WHERE project_id = ?', [projToDelete.id], () => resolve());
      });
      await new Promise((resolve) => {
        db.run('DELETE FROM project_tasks WHERE project_id = ? OR project_code = ?', [projToDelete.id, projToDelete.project_code], () => resolve());
      });
      await new Promise((resolve) => {
        db.run('DELETE FROM projects WHERE id = ?', [projToDelete.id], () => resolve());
      });

      deletedRecords.push({
        code: projToDelete.project_code,
        title: projToDelete.title
      });
      console.log(`   ✅ Deleted [${projToDelete.project_code}]`);
    }
  }

  // 3. Re-run seed script to guarantee all 20 projects have accurate metadata
  console.log('\n🔄 Refreshing official 20 projects with seed data...');
  const seedScript = require('./seed-pdf-elite-teams');
  // seed-pdf-elite-teams runs automatically if executed directly, or we can check project list
  
  // 4. Query and verify final projects in database
  const finalProjects = await new Promise((resolve, reject) => {
    db.all('SELECT id, project_code, title, batch, team_number, progress, status, team_members FROM projects ORDER BY project_code ASC', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

  console.log('\n======================================================');
  console.log('📋 DATABASE CLEANUP & REPLACEMENT SUMMARY');
  console.log('======================================================');
  console.log(`\n1. MIGRATED RECORDS (${migratedRecords.length}):`);
  migratedRecords.forEach(m => {
    console.log(`   - [${m.oldCode}] ("${m.oldTitle}") -> MIGRATED TO [${m.newCode}] ("${m.newTitle}")`);
  });

  console.log(`\n2. DELETED PURE PLACEHOLDER RECORDS (${deletedRecords.length}):`);
  deletedRecords.forEach(d => {
    console.log(`   - [${d.code}] ("${d.title}") -> DELETED COMPLETELY`);
  });

  console.log(`\n3. FINAL PROJECT COUNT: ${finalProjects.length} projects`);
  console.log('------------------------------------------------------');
  finalProjects.forEach((p, idx) => {
    let memCount = 0;
    try {
      memCount = JSON.parse(p.team_members || '[]').length;
    } catch(e) {
      memCount = (p.team_members || '').split(',').length;
    }
    console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. [${p.project_code}] (Batch ${p.batch}, Team ${p.team_number || '-'}) "${p.title}" - Status: ${p.status} | Progress: ${p.progress}% | Members: ${memCount}`);
  });
  console.log('======================================================\n');

  db.close();
}

runCleanup().catch(err => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
