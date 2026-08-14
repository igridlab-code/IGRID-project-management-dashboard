const fs = require('fs');

async function checkRepos() {
  const res = await fetch('https://api.github.com/users/igridlab-code/repos?per_page=100');
  const repos = await res.json();
  console.log(`Found ${repos.length} public repos on github.com/igridlab-code:\n`);

  for (const r of repos) {
    console.log(`========================================`);
    console.log(`📦 Repo: ${r.name}`);
    console.log(`🔗 URL: ${r.html_url}`);
    console.log(`📝 Description: ${r.description || 'No description'}`);
    console.log(`💻 Language: ${r.language}`);

    // Fetch README to find images or project details
    try {
      const rmRes = await fetch(`https://raw.githubusercontent.com/igridlab-code/${r.name}/main/README.md`);
      if (rmRes.ok) {
        const rmText = await rmRes.text();
        console.log(`📄 README (first 300 chars): ${rmText.replace(/\r?\n/g, ' ').slice(0, 300)}...`);
        // Find image links in README
        const imgMatches = rmText.match(/!\[.*?\]\((.*?)\)|<img[^>]+src=["']([^"']+)["']/g);
        if (imgMatches) {
          console.log(`🖼️ Found ${imgMatches.length} images in README:`, imgMatches.slice(0, 3));
        }
      }
    } catch(e) {}
  }
}

checkRepos().catch(console.error);
