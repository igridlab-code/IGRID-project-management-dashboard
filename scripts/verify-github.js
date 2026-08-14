fetch('http://localhost:3000/api/projects').then(r => r.json()).then(projects => {
  console.log('--- 14 MATCHED GITHUB PROJECTS IN DATABASE ---');
  projects.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.project_code}] ${p.title}\n   GitHub: ${p.github_repo}\n   Image: ${p.image_url.slice(0, 60)}...\n`);
  });
}).catch(console.error);
