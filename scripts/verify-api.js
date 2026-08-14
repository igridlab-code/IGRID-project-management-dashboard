Promise.all([
  fetch('http://localhost:3000/api/projects').then(r => r.json()),
  fetch('http://localhost:3000/api/students').then(r => r.json()),
  fetch('http://localhost:3000/api/bom').then(r => r.json()),
  fetch('http://localhost:3000/api/analytics').then(r => r.json())
]).then(([projects, students, bom, analytics]) => {
  console.log('🎉 PROJECTS IN DATABASE:', projects.length);
  console.log('👥 STUDENTS IN DATABASE:', students.length);
  console.log('💎 BOM ITEMS IN DATABASE:', bom.length);
  console.log('📊 ANALYTICS STATS:', analytics.byStatus);
  console.log('\n--- 20 LOADED OBSIDIAN PROJECTS ---');
  projects.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.project_code}] ${p.title} (${p.domain}) | Progress: ${p.progress}% | Status: ${p.status} | Lead: ${p.team_lead}`);
  });
}).catch(e => console.error(e));
