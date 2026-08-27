const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'igrid.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize Tables and Sample Data
function initDb() {
  db.serialize(() => {
    // Projects Table with Media & Social links
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        domain TEXT NOT NULL,
        tags TEXT DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('in_queue', 'in_progress', 'testing', 'completed')),
        priority TEXT NOT NULL CHECK(priority IN ('High', 'Normal', 'Low')),
        progress INTEGER DEFAULT 0,
        start_date TEXT,
        due_date TEXT,
        immediate_action TEXT,
        github_repo TEXT,
        youtube_url TEXT,
        linkedin_url TEXT,
        doc_url TEXT,
        image_url TEXT,
        bom_status TEXT DEFAULT 'Not Required',
        team_name TEXT,
        team_lead TEXT,
        team_lead_photo TEXT,
        team_members TEXT,
        deliverables TEXT,
        comments_count INTEGER DEFAULT 0,
        attachments_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schema Migrations if columns don't exist in older db
    const newColumns = [
      { name: 'image_url', type: 'TEXT' },
      { name: 'youtube_url', type: 'TEXT' },
      { name: 'linkedin_url', type: 'TEXT' },
      { name: 'doc_url', type: 'TEXT' },
      { name: 'team_lead_photo', type: 'TEXT' }
    ];

    newColumns.forEach(col => {
      db.run(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`, (err) => {
        // Silently ignore if column already exists
      });
    });

    // Students Directory
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roll_no TEXT NOT NULL UNIQUE,
        email TEXT,
        department TEXT,
        year TEXT,
        role TEXT,
        skills TEXT,
        avatar_color TEXT,
        avatar_initials TEXT,
        photo_url TEXT
      )
    `);

    // BOM Items
    db.run(`
      CREATE TABLE IF NOT EXISTS bom_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        project_code TEXT,
        item_name TEXT NOT NULL,
        part_number TEXT,
        category TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0.0,
        total_price REAL NOT NULL DEFAULT 0.0,
        supplier_url TEXT,
        datasheet_url TEXT,
        justification TEXT,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Ordered', 'Received')) DEFAULT 'Pending',
        admin_remarks TEXT,
        submitted_by TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Activities / Comments
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        author TEXT NOT NULL,
        author_role TEXT,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'comment',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Authentication Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        google_id TEXT,
        auth_provider TEXT DEFAULT 'email',
        reset_token TEXT,
        reset_token_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Domains Table
    db.run(`
      CREATE TABLE IF NOT EXISTS domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project Tasks Table for Project-Specific Gantt Timeline
    db.run(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        project_code TEXT NOT NULL,
        task_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        description TEXT,
        assigned_member TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Seed default domains if domains table is empty
    db.get('SELECT COUNT(*) as count FROM domains', (err, row) => {
      if (!err && (!row || row.count === 0)) {
        const defaultDomains = [
          { name: 'AI', description: 'AI & Computer Vision' },
          { name: 'Robotics', description: 'Robotics & Manipulators' },
          { name: 'Drones', description: 'Drones & UAVs' },
          { name: 'IoT', description: 'IoT & Smart Grid' },
          { name: 'Embedded', description: 'Embedded Systems & FPGA' }
        ];
        const stmt = db.prepare('INSERT OR IGNORE INTO domains (name, description) VALUES (?, ?)');
        defaultDomains.forEach(d => stmt.run(d.name, d.description));
        stmt.finalize();
      }
    });

    // Seed Initial Data if empty
    db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
      if (err) return console.error(err);
      if (row.count === 0) {
        console.log('Seeding initial IGRID Lab projects with media & student rosters...');
        seedInitialData();
      } else {
        // Ensure default project tasks exist
        seedInitialTasksIfEmpty();
      }
    });
  });
}

function seedInitialData() {
  const students = [
    { name: "Priya Sundaram", roll_no: "21AI015", email: "priya.s@igrid.lab", department: "Artificial Intelligence", year: "3rd Year", role: "AI/Vision Specialist", skills: "PyTorch, YOLOv8, OpenCV, CUDA", avatar_color: "#ec4899", avatar_initials: "PS", photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
    { name: "Aarav Sharma", roll_no: "21RA001", email: "aarav.s@igrid.lab", department: "Robotics & Automation", year: "3rd Year", role: "Robotics Lead", skills: "ROS2, Gazebo, C++, SLAM", avatar_color: "#6366f1", avatar_initials: "AS", photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { name: "Rohan Kulkarni", roll_no: "22CS105", email: "rohan.k@igrid.lab", department: "Computer Science", year: "2nd Year", role: "Drone Flight Systems", skills: "PX4, ArduPilot, MAVLink, Python", avatar_color: "#06b6d4", avatar_initials: "RK", photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { name: "Ananya Iyer", roll_no: "21EC019", email: "ananya.i@igrid.lab", department: "Electronics & Comm", year: "3rd Year", role: "IoT Sensor Mesh Lead", skills: "LoRaWAN, MQTT, Zigbee, Node-RED", avatar_color: "#8b5cf6", avatar_initials: "AI", photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
    { name: "Karthik Verma", roll_no: "22EC042", email: "karthik.v@igrid.lab", department: "Electronics & Comm", year: "2nd Year", role: "Embedded & PCB Designer", skills: "Altium, KiCad, STM32, ESP32, FreeRTOS", avatar_color: "#10b981", avatar_initials: "KV", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { name: "Neha Deshmukh", roll_no: "21ME088", email: "neha.d@igrid.lab", department: "Mechanical Engg", year: "3rd Year", role: "CAD & 3D Prototyping", skills: "SolidWorks, Fusion360, FEA Analysis", avatar_color: "#f59e0b", avatar_initials: "ND", photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { name: "Vikram Malhotra", roll_no: "20ME003", email: "vikram.m@igrid.lab", department: "Mechanical Engg", year: "4th Year", role: "Chassis & Drivetrain", skills: "Robotics Kinematics, Ansys, 3D Print", avatar_color: "#3b82f6", avatar_initials: "VM", photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { name: "Meera Nair", roll_no: "22AI034", email: "meera.n@igrid.lab", department: "Artificial Intelligence", year: "2nd Year", role: "ML Edge Engineer", skills: "TensorRT, Jetson Nano, ONNX", avatar_color: "#14b8a6", avatar_initials: "MN", photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }
  ];

  const insertStudentStmt = db.prepare(`
    INSERT INTO students (name, roll_no, email, department, year, role, skills, avatar_color, avatar_initials, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  students.forEach(s => {
    insertStudentStmt.run(s.name, s.roll_no, s.email, s.department, s.year, s.role, s.skills, s.avatar_color, s.avatar_initials, s.photo_url);
  });
  insertStudentStmt.finalize();

  const projects = [
    {
      project_code: "IGRID-AI-01",
      title: "Edge Vision Defect Detection System",
      description: "Real-time AI camera system using YOLOv8 & TensorRT on NVIDIA Jetson Orin to detect manufacturing defects on high-speed conveyor belts.",
      domain: "AI",
      tags: "#EdgeAI,#YOLOv8,#JetsonOrin,#ComputerVision,#IndustrialAI",
      status: "in_progress",
      priority: "High",
      progress: 68,
      start_date: "2026-02-01",
      due_date: "2026-03-25",
      immediate_action: "Optimize TensorRT FP16 quantization pipeline & complete camera mount CAD design.",
      github_repo: "https://github.com/igrid-lab/edge-vision-defect-detector",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://developer.nvidia.com/jetson-orin-nano",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team VisionCore",
      team_lead: "Priya Sundaram",
      team_lead_photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Priya Sundaram", role: "AI/Vision Specialist", initials: "PS", color: "#ec4899", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
        { name: "Meera Nair", role: "ML Edge Engineer", initials: "MN", color: "#14b8a6", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        { name: "Karthik Verma", role: "Embedded Systems", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Trained INT8 Model, Jetson Docker Container, 3D Camera Mount, Evaluation Report with 98.4% mAP.",
      comments_count: 11,
      attachments_count: 9
    },
    {
      project_code: "IGRID-ROB-02",
      title: "6-DOF Modular Robotic Arm for Pick & Place",
      description: "Custom 3D-printed and CNC aluminum 6-axis robotic manipulator with MoveIt2 trajectory planning, custom BLDC motor drivers, and CAN bus control.",
      domain: "Robotics",
      tags: "#ROS2,#MoveIt2,#RoboticArm,#CANBus,#InverseKinematics,#BLDC",
      status: "in_progress",
      priority: "High",
      progress: 45,
      start_date: "2026-01-15",
      due_date: "2026-04-10",
      immediate_action: "Flash custom firmware on STM32 CAN motor drivers and calibrate joint encoders.",
      github_repo: "https://github.com/igrid-lab/6dof-modular-robot-arm",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://ros.org",
      image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team RoboKinematics",
      team_lead: "Aarav Sharma",
      team_lead_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Aarav Sharma", role: "Robotics Lead", initials: "AS", color: "#6366f1", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        { name: "Neha Deshmukh", role: "CAD & 3D Prototyping", initials: "ND", color: "#f59e0b", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
        { name: "Vikram Malhotra", role: "Chassis & Drivetrain", initials: "VM", color: "#3b82f6", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
        { name: "Karthik Verma", role: "Motor Driver PCB", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "ROS2 Package, URDF Model, Custom PCB schematics, MoveIt2 pick & place demo video.",
      comments_count: 14,
      attachments_count: 6
    },
    {
      project_code: "IGRID-DRN-03",
      title: "Autonomous Indoor Drone with GPS-Denied SLAM",
      description: "Micro quadcopter equipped with OAK-D spatial AI camera and 2D LiDAR running Fast-LIO visual-inertial odometry for autonomous indoor navigation.",
      domain: "Drones",
      tags: "#Drones,#PX4,#VIO,#SLAM,#OAK_D,#AutonomousFlight,#ROS2",
      status: "testing",
      priority: "High",
      progress: 82,
      start_date: "2026-01-10",
      due_date: "2026-03-18",
      immediate_action: "Conduct obstacle-avoidance waypoint flight test in Lab Zone B & tune PID loops.",
      github_repo: "https://github.com/igrid-lab/gps-denied-indoor-drone",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://docs.px4.io",
      image_url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team AeroViper",
      team_lead: "Rohan Kulkarni",
      team_lead_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Rohan Kulkarni", role: "Flight Systems Lead", initials: "RK", color: "#06b6d4", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
        { name: "Priya Sundaram", role: "VIO & SLAM Algorithms", initials: "PS", color: "#ec4899", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
        { name: "Neha Deshmukh", role: "Carbon Fiber Frame CAD", initials: "ND", color: "#f59e0b", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Flight logs analysis, ROS2 autonomous waypoint launch package, 3D printed prop guards.",
      comments_count: 7,
      attachments_count: 14
    },
    {
      project_code: "IGRID-IOT-04",
      title: "Self-Healing LoRaWAN Mesh Agriculture Sensor Node",
      description: "Ultra-low power solar-harvested soil and microclimate telemetry nodes utilizing ESP32-S3 and SX1262 LoRa modules communicating across 5km range.",
      domain: "IoT",
      tags: "#IoT,#LoRaWAN,#ESP32S3,#EnergyHarvesting,#SmartAgri,#MQTT",
      status: "in_queue",
      priority: "Normal",
      progress: 15,
      start_date: "2026-02-20",
      due_date: "2026-04-30",
      immediate_action: "BOM Approval Required: Solar MPPT ICs & Waterproof sensor probes awaiting Lab Director signoff.",
      github_repo: "https://github.com/igrid-lab/lora-agri-mesh-node",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://www.thethingsnetwork.org",
      image_url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&auto=format&fit=crop&q=80",
      bom_status: "Submitted",
      team_name: "Team AgriMesh",
      team_lead: "Ananya Iyer",
      team_lead_photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Ananya Iyer", role: "IoT Sensor Mesh Lead", initials: "AI", color: "#8b5cf6", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
        { name: "Karthik Verma", role: "PCB & Power Electronics", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Custom KiCad PCB Gerber files, Low-power Sleep firmware, Grafana Cloud Dashboard.",
      comments_count: 3,
      attachments_count: 1
    },
    {
      project_code: "IGRID-EMB-05",
      title: "FPGA-Accelerated Motor Current FOC Controller",
      description: "Xilinx Zynq-7000 FPGA-based Field Oriented Control (FOC) hardware IP core for high-bandwidth precision torque control in quadruped robotics.",
      domain: "Embedded",
      tags: "#FPGA,#Zynq7000,#FOC,#Verilog,#MotorControl,#HighSpeedDSP",
      status: "in_queue",
      priority: "High",
      progress: 10,
      start_date: "2026-02-15",
      due_date: "2026-05-15",
      immediate_action: "BOM Approval Required: Digilent Cora Z7 FPGA Dev Boards ($318.00) pending purchase sign-off.",
      github_repo: "https://github.com/igrid-lab/fpga-foc-controller",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://digilent.com",
      image_url: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=80",
      bom_status: "Submitted",
      team_name: "Team SiliconCore",
      team_lead: "Karthik Verma",
      team_lead_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Karthik Verma", role: "FPGA & Hardware Lead", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
        { name: "Aarav Sharma", role: "Robotics Controls Integration", initials: "AS", color: "#6366f1", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Verilog IP Cores, MATLAB Simulink bench test results, Vivado project archive.",
      comments_count: 8,
      attachments_count: 19
    },
    {
      project_code: "IGRID-ROB-06",
      title: "Autonomous Mobile Robot (AMR) with LiDAR SLAM",
      description: "Differential drive warehouse robot with Nav2 autonomous navigation, RPLiDAR A2, wheel odometry EKF fusion, and dynamic obstacle avoidance.",
      domain: "Robotics",
      tags: "#ROS2,#Nav2,#SLAM,#RPLiDAR,#AMR,#AutonomousRobotics",
      status: "testing",
      priority: "Normal",
      progress: 90,
      start_date: "2026-01-05",
      due_date: "2026-03-12",
      immediate_action: "Run 24-hour continuous navigation burn-in test in college corridors.",
      github_repo: "https://github.com/igrid-lab/amr-nav2-autonomous-robot",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://navigation.ros.org",
      image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team RoboKinematics",
      team_lead: "Aarav Sharma",
      team_lead_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Aarav Sharma", role: "Robotics Lead", initials: "AS", color: "#6366f1", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        { name: "Vikram Malhotra", role: "Mechanical Chassis", initials: "VM", color: "#3b82f6", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
        { name: "Rohan Kulkarni", role: "Telemetry & WiFi", initials: "RK", color: "#06b6d4", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Autonomous AMR platform, Nav2 map dataset of Innovation center, emergency e-stop module.",
      comments_count: 6,
      attachments_count: 10
    },
    {
      project_code: "IGRID-AI-07",
      title: "Voice-Controlled Lab Assistant with Edge LLM",
      description: "Speech-to-text whisper.cpp engine coupled with quantized LLaMA-3 8B model running locally on Ollama to automate lab equipment and query inventory.",
      domain: "AI",
      tags: "#EdgeLLM,#Ollama,#Whisper,#VoiceAI,#LocalAI,#LabAutomation",
      status: "in_progress",
      priority: "Low",
      progress: 52,
      start_date: "2026-02-05",
      due_date: "2026-04-05",
      immediate_action: "Connect Ollama REST API with lab tool database & build microphone beamforming array.",
      github_repo: "https://github.com/igrid-lab/igrid-voice-assistant",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://ollama.com",
      image_url: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team VisionCore",
      team_lead: "Priya Sundaram",
      team_lead_photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Priya Sundaram", role: "AI Lead", initials: "PS", color: "#ec4899", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
        { name: "Meera Nair", role: "Edge Inference", initials: "MN", color: "#14b8a6", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Whisper + LLaMA FastAPI server, Raspberry Pi 5 touch UI, Lab inventory skill plugin.",
      comments_count: 10,
      attachments_count: 4
    },
    {
      project_code: "IGRID-DRN-08",
      title: "Tethered Hexacopter for High-Altitude Lab Surveillance",
      description: "Heavy-lift hexacopter with continuous 400W ground-tethered DC power supply, thermal FLIR gimbal, and automated winch tether tensioner.",
      domain: "Drones",
      tags: "#Drones,#TetheredUAV,#HighVoltageDC,#ThermalGimbal,#Hexacopter",
      status: "completed",
      priority: "Normal",
      progress: 100,
      start_date: "2025-10-01",
      due_date: "2026-01-20",
      immediate_action: "Project successfully deployed & showcased during Annual Innovation Expo 2026.",
      github_repo: "https://github.com/igrid-lab/tethered-hexacopter-station",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://ardupilot.org",
      image_url: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team AeroViper",
      team_lead: "Rohan Kulkarni",
      team_lead_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Rohan Kulkarni", role: "Flight Systems Lead", initials: "RK", color: "#06b6d4", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
        { name: "Vikram Malhotra", role: "Winch Mechanism Design", initials: "VM", color: "#3b82f6", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
        { name: "Karthik Verma", role: "400V DC-DC Buck Converter", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Completed Hexacopter Rig, 100m Power Tether Winch, Lab Safety Certificate, 4-Hour Flight Demo Video.",
      comments_count: 18,
      attachments_count: 22
    },
    {
      project_code: "IGRID-IOT-09",
      title: "Smart Smart-Grid Power Quality Analyzer",
      description: "Multi-channel True RMS voltage and current waveform capture instrument with harmonics analysis (FFT) and cloud telemetry.",
      domain: "IoT",
      tags: "#SmartGrid,#PowerQuality,#FFT,#ESP32,#Energy,#CloudTelemetry",
      status: "completed",
      priority: "Normal",
      progress: 100,
      start_date: "2025-09-15",
      due_date: "2026-01-10",
      immediate_action: "Deployed at Lab Substation Panel; data streaming live to ThingsBoard dashboard.",
      github_repo: "https://github.com/igrid-lab/smart-grid-analyzer",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      linkedin_url: "https://www.linkedin.com/feed/",
      doc_url: "https://thingsboard.io",
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      bom_status: "Approved",
      team_name: "Team AgriMesh",
      team_lead: "Ananya Iyer",
      team_lead_photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      team_members: JSON.stringify([
        { name: "Ananya Iyer", role: "IoT Lead", initials: "AI", color: "#8b5cf6", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
        { name: "Karthik Verma", role: "High-Voltage Isolation PCB", initials: "KV", color: "#10b981", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      ]),
      deliverables: "Calibrated 3-Phase Energy Monitor, IEC 61000-4-30 compliance report, ThingsBoard dashboard.",
      comments_count: 12,
      attachments_count: 15
    }
  ];

  const insertProjectStmt = db.prepare(`
    INSERT INTO projects (
      project_code, title, description, domain, tags, status, priority,
      progress, start_date, due_date, immediate_action, github_repo,
      youtube_url, linkedin_url, doc_url, image_url,
      bom_status, team_name, team_lead, team_lead_photo, team_members, deliverables,
      comments_count, attachments_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  projects.forEach(p => {
    insertProjectStmt.run(
      p.project_code, p.title, p.description, p.domain, p.tags, p.status, p.priority,
      p.progress, p.start_date, p.due_date, p.immediate_action, p.github_repo,
      p.youtube_url, p.linkedin_url, p.doc_url, p.image_url,
      p.bom_status, p.team_name, p.team_lead, p.team_lead_photo, p.team_members, p.deliverables,
      p.comments_count, p.attachments_count
    );
  });
  insertProjectStmt.finalize();

  // BOM items
  const boms = [
    {
      project_code: "IGRID-AI-01",
      item_name: "NVIDIA Jetson Orin Nano Developer Kit (8GB)",
      part_number: "945-13766-0000-000",
      category: "Compute",
      quantity: 1,
      unit_price: 499.00,
      total_price: 499.00,
      supplier_url: "https://www.arrow.com",
      datasheet_url: "https://developer.nvidia.com/jetson-orin-nano",
      justification: "Primary edge AI compute module required for 40 TOPS INT8 inference for conveyor defect detection.",
      status: "Approved",
      admin_remarks: "Approved by Lab Director. Purchased under Innovation Grant 2026.",
      submitted_by: "Priya Sundaram"
    },
    {
      project_code: "IGRID-AI-01",
      item_name: "Sony IMX477 12.3MP High Quality Camera + 6mm Lens",
      part_number: "RPI-HQ-CAM-12MP",
      category: "Sensors",
      quantity: 2,
      unit_price: 65.00,
      total_price: 130.00,
      supplier_url: "https://robu.in",
      datasheet_url: "https://www.raspberrypi.com/products/raspberry-pi-high-quality-camera/",
      justification: "Industrial high-shutter speed cameras for capturing fast-moving assembly parts.",
      status: "Approved",
      admin_remarks: "Approved. Delivered to Lab locker #4.",
      submitted_by: "Priya Sundaram"
    },
    {
      project_code: "IGRID-ROB-02",
      item_name: "T-Motor AK80-9 High Torque BLDC Actuator",
      part_number: "AK80-9-KV100",
      category: "Actuators",
      quantity: 3,
      unit_price: 280.00,
      total_price: 840.00,
      supplier_url: "https://store.tmotor.com",
      datasheet_url: "https://store.tmotor.com/product/ak80-9-actuator.html",
      justification: "Quasi-direct drive dynamic joints for base, shoulder and elbow of 6-DOF arm.",
      status: "Approved",
      admin_remarks: "Allocated from Robotics Tier-1 fund.",
      submitted_by: "Aarav Sharma"
    },
    {
      project_code: "IGRID-DRN-03",
      item_name: "Luxonis OAK-D S2 Spatial AI & Depth Camera",
      part_number: "OAK-D-S2",
      category: "Sensors",
      quantity: 1,
      unit_price: 249.00,
      total_price: 249.00,
      supplier_url: "https://shop.luxonis.com",
      datasheet_url: "https://docs.luxonis.com/projects/hardware/en/latest/pages/DM9098s2.html",
      justification: "Stereo depth and on-chip Myriad X VPU for obstacle mapping in GPS-denied indoor flight.",
      status: "Approved",
      admin_remarks: "Approved. In use in Drone Testing Cage.",
      submitted_by: "Rohan Kulkarni"
    },
    {
      project_code: "IGRID-IOT-04",
      item_name: "Semtech SX1262 LoRa Transceiver breakout board",
      part_number: "SX1262-868/915M",
      category: "Communication",
      quantity: 6,
      unit_price: 14.50,
      total_price: 87.00,
      supplier_url: "https://www.waveshare.com",
      datasheet_url: "https://www.semtech.com/products/wireless-rf/lora-core/sx1262",
      justification: "Long-range low-power RF frontend for agriculture sensor nodes.",
      status: "Pending",
      admin_remarks: "Under review by Lab Procurement committee.",
      submitted_by: "Ananya Iyer"
    },
    {
      project_code: "IGRID-EMB-05",
      item_name: "Digilent Cora Z7: Zynq-7000 Dual Core ARM/FPGA SoC",
      part_number: "410-370-1",
      category: "Compute",
      quantity: 2,
      unit_price: 159.00,
      total_price: 318.00,
      supplier_url: "https://digilent.com",
      datasheet_url: "https://digilent.com/reference/programmable-logic/cora-z7/start",
      justification: "Hardware platform for synthesis of Verilog FOC motor controller logic.",
      status: "Pending",
      admin_remarks: "Waiting for student team quotation comparison.",
      submitted_by: "Karthik Verma"
    }
  ];

  const insertBomStmt = db.prepare(`
    INSERT INTO bom_items (
      project_code, item_name, part_number, category, quantity, unit_price,
      total_price, supplier_url, datasheet_url, justification, status,
      admin_remarks, submitted_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  boms.forEach(b => {
    insertBomStmt.run(
      b.project_code, b.item_name, b.part_number, b.category, b.quantity,
      b.unit_price, b.total_price, b.supplier_url, b.datasheet_url,
      b.justification, b.status, b.admin_remarks, b.submitted_by
    );
  });
  insertBomStmt.finalize();

  console.log('IGRID Lab database initialized with rich media, photos, YouTube links & student rosters.');
  seedInitialTasksIfEmpty();
}

function seedInitialTasksIfEmpty() {
  db.get('SELECT COUNT(*) as count FROM project_tasks', (err, row) => {
    if (err) return;
    if (!row || row.count === 0) {
      console.log('Seeding initial project-specific timeline tasks...');
      db.all('SELECT id, project_code, start_date, due_date, team_lead FROM projects', [], (err2, projects) => {
        if (err2 || !projects || projects.length === 0) return;

        const defaultTaskTemplates = {
          'IGRID-AI-01': [
            { name: 'Dataset Collection & Annotation', start: '2026-02-01', end: '2026-02-12', status: 'completed', member: 'Priya Sundaram', desc: 'Collected 5,000 conveyor images and labeled defect bounding boxes.' },
            { name: 'YOLOv8 Model Training & Quantization', start: '2026-02-13', end: '2026-02-25', status: 'completed', member: 'Meera Nair', desc: 'Trained YOLOv8s model and converted to TensorRT INT8 precision.' },
            { name: 'Camera Hardware Mount & Opticals Setup', start: '2026-02-26', end: '2026-03-08', status: 'in_progress', member: 'Karthik Verma', desc: '3D printed adjustable camera rig and integrated industrial ring light.' },
            { name: 'Jetson Orin Inference Pipeline Integration', start: '2026-03-09', end: '2026-03-18', status: 'in_progress', member: 'Priya Sundaram', desc: 'Optimizing Zero-Copy CUDA memory buffers for 60 FPS throughput.' },
            { name: 'Conveyor Belt Field Deployment & Validation', start: '2026-03-19', end: '2026-03-25', status: 'pending', member: 'Meera Nair', desc: 'Final staging test on physical conveyor line with defect injection.' }
          ],
          'IGRID-ROB-02': [
            { name: '3D CAD Arm Kinematics & FEA Analysis', start: '2026-01-15', end: '2026-01-28', status: 'completed', member: 'Neha Deshmukh', desc: 'Designed 6-DOF link geometry in Fusion360 with stress FEA simulation.' },
            { name: 'STM32 Motor Driver PCB Fabrication & Testing', start: '2026-01-29', end: '2026-02-15', status: 'completed', member: 'Karthik Verma', desc: 'Designed 4-layer PCB with DRV8302 BLDC driver ICs and CAN transceiver.' },
            { name: 'Joint Assembly & Encoder Calibration', start: '2026-02-16', end: '2026-03-05', status: 'in_progress', member: 'Vikram Malhotra', desc: 'Assembled harmonic drive reducers and calibrated magnetic absolute encoders.' },
            { name: 'ROS2 MoveIt2 Trajectory Controller Integration', start: '2026-03-06', end: '2026-03-22', status: 'in_progress', member: 'Aarav Sharma', desc: 'Configured MoveIt2 URDF kinematic solver and tuned PID joint controllers.' },
            { name: 'End-Effector Gripper & Vision Pick-and-Place Test', start: '2026-03-23', end: '2026-04-10', status: 'pending', member: 'Aarav Sharma', desc: 'Integrating vacuum gripper with camera feedback for target object pick and place.' }
          ],
          'IGRID-DRN-03': [
            { name: 'Frame Assembly & ESC Wiring', start: '2026-01-10', end: '2026-01-22', status: 'completed', member: 'Rohan Kulkarni', desc: 'Carbon fiber quadcopter frame assembly and high-current PDB soldering.' },
            { name: 'OAK-D Spatial Camera & LiDAR Mount', start: '2026-01-23', end: '2026-02-08', status: 'completed', member: 'Neha Deshmukh', desc: 'Vibration-damped 3D mount for depth camera and 2D LiDAR sensor.' },
            { name: 'Fast-LIO VIO & Sensor Fusion Tuning', start: '2026-02-09', end: '2026-02-28', status: 'completed', member: 'Priya Sundaram', desc: 'Kalman filter fusion for visual-inertial odometry without GPS.' },
            { name: 'Indoor GPS-Denied Flight Control Integration', start: '2026-03-01', end: '2026-03-12', status: 'in_progress', member: 'Rohan Kulkarni', desc: 'PX4 offboard mode communication with onboard companion computer.' },
            { name: 'Obstacle Avoidance Flight Staging Test', start: '2026-03-13', end: '2026-03-18', status: 'pending', member: 'Rohan Kulkarni', desc: 'Testing obstacle-avoidance waypoint navigation in indoor cage.' }
          ]
        };

        const stmt = db.prepare(`
          INSERT INTO project_tasks (project_id, project_code, task_name, start_date, end_date, status, description, assigned_member)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        projects.forEach(p => {
          const templates = defaultTaskTemplates[p.project_code] || [
            { name: 'Phase 1: Architecture & Requirements', start: p.start_date || '2026-02-01', end: '2026-02-15', status: 'completed', member: p.team_lead || 'Lead', desc: 'Initial system specs and architecture definition.' },
            { name: 'Phase 2: Hardware & Software Prototype', start: '2026-02-16', end: '2026-03-15', status: 'in_progress', member: p.team_lead || 'Lead', desc: 'Prototyping core modules and integration.' },
            { name: 'Phase 3: Testing & Final Showcase Staging', start: '2026-03-16', end: p.due_date || '2026-04-15', status: 'pending', member: p.team_lead || 'Lead', desc: 'Staging, testing and documentation.' }
          ];

          templates.forEach(t => {
            stmt.run(p.id, p.project_code, t.name, t.start, t.end, t.status, t.desc || '', t.member || '');
          });
        });

        stmt.finalize();
      });
    }
  });
}

module.exports = { db, initDb };
