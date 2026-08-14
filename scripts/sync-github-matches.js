/**
 * IGRID INNOVATION LAB - GITHUB SYNC ENGINE
 * Matches live repositories from https://github.com/igridlab-code to all projects in SQLite.
 * Updates exact GitHub URLs, enhanced descriptions, branding names, and screenshot assets.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'igrid.db');
const db = new sqlite3.Database(dbPath);

const githubMappings = [
  {
    code: 'IGRID-ERP-01',
    github_repo: 'https://github.com/igridlab-code/Academic_ERP_System',
    title: 'Academic ERP System',
    description: 'A comprehensive web-based Academic ERP System for colleges that streamlines student, faculty, attendance, marks, timetable, notices, and administrative management through secure role-based access for Admin, Faculty, and Students.'
  },
  {
    code: 'IGRID-ERP-02',
    github_repo: 'https://github.com/igridlab-code/Transport_ERP_System',
    title: 'Transport ERP System',
    description: 'College Bus Transport Management System — A modern multi-role transport ERP portal for educational institutions supporting fleet management, live bus routing, driver dispatch, and student pass tracking.'
  },
  {
    code: 'IGRID-AI-03',
    github_repo: 'https://github.com/igridlab-code/Waste-Segregagtion-System',
    title: 'AI-Based Waste Segregation System',
    description: 'On-device TinyML waste classification & automated motorized sorting lid using Seeed Studio XIAO ESP32S3 Sense. Directly retrofits onto existing public dual-compartment dustbins.',
    image_url: 'https://github.com/user-attachments/assets/d00b5eea-7365-4ce1-8b1a-a8bed2477029'
  },
  {
    code: 'IGRID-AI-04',
    github_repo: 'https://github.com/igridlab-code/Campus-Carbon-Footprint-Dashboard',
    title: 'Enviora — Campus Carbon Footprint Dashboard',
    description: 'Enviora (IndraVerse) — A GIS-powered sustainability digital twin for campus infrastructure, combining real-time carbon/energy telemetry, interactive 360° virtual tours, and Google Gemini AI audits to help institutions track and reduce their environmental footprint.',
    image_url: 'https://raw.githubusercontent.com/igridlab-code/Campus-Carbon-Footprint-Dashboard/main/src/assets/hero-banner.png'
  },
  {
    code: 'IGRID-BIO-05',
    github_repo: 'https://github.com/igridlab-code/ArboPulse-AI',
    title: 'ArboPulse AI — Tree Health Monitoring System',
    description: 'ArboPulse AI — Tree Health Monitoring System combining multi-spectral IoT sap sensors and AI classification to monitor urban and campus tree vitality, disease progression, and environmental moisture levels.',
    image_url: 'https://raw.githubusercontent.com/igridlab-code/ArboPulse-AI/main/src/assets/images/Dashboard.png'
  },
  {
    code: 'IGRID-IOT-06',
    github_repo: 'https://github.com/igridlab-code/Smart-IR-switch',
    title: 'Smart IR Switch',
    description: 'Smart IR Switch with optically isolated solid-state relays for remote and automated switching of classroom, auditorium, and laboratory high-voltage electrical appliances.'
  },
  {
    code: 'IGRID-AI-08',
    github_repo: 'https://github.com/igridlab-code/Smart-Irrigation-System-using-Gemini-API',
    title: 'Smart Irrigation System (Gemini AI)',
    description: 'AI-based smart automated irrigation system that monitors plant and soil conditions using a Seeed Studio camera and Google Gemini Vision API for automatic moisture assessment and precision water dispensing.'
  },
  {
    code: 'IGRID-AI-09',
    github_repo: 'https://github.com/igridlab-code/camera-based-attendance-system-',
    title: 'Camera-Based Attendance System',
    description: 'Automated high-accuracy face recognition attendance system for lecture halls using OpenCV, deep learning facial feature extraction, and automated student logging.'
  },
  {
    code: 'IGRID-AI-10',
    github_repo: 'https://github.com/igridlab-code/placement-readiness-prediction-portal',
    title: 'Placement Readiness & Prediction Portal',
    description: 'An AI-powered Placement Readiness and Prediction Portal that evaluates student placement preparedness, predicts placement chances using machine learning models, and offers aptitude practice modules.'
  },
  {
    code: 'IGRID-ROB-12',
    github_repo: 'https://github.com/igridlab-code/bhoomi',
    title: 'EcoBottle (Bhoomi) — Robotic Recycling System',
    description: 'EcoBottle (Bhoomi) — Cloud-connected smart plastic bottle recycling and reverse vending machine with Firebase telemetry, student reward points, and automated compactor mechanism.'
  },
  {
    code: 'IGRID-DRN-17',
    github_repo: 'https://github.com/igridlab-code/drone_crowd_monitoring_system-',
    title: 'Drone Crowd Monitoring System',
    description: 'Autonomous UAV aerial crowd density estimation and movement telemetry system utilizing onboard computer vision and Pixhawk flight telemetry.'
  },
  {
    code: 'IGRID-DRN-18',
    github_repo: 'https://github.com/igridlab-code/Lora-based-digital-twin-',
    title: 'LoRa-Based Drone Digital Twin',
    description: 'LoRa-Based Digital Twin for UAV telemetry. Wirelessly transmits 3-axis orientation (Roll, Pitch, Yaw) and spatial telemetry from sender drone to ground control station using Wio-E5 LoRa module.'
  },
  {
    code: 'IGRID-BIO-19',
    github_repo: 'https://github.com/igridlab-code/Smart-Medical-Device-Prototype',
    title: 'Smart Medical Device Prototype',
    description: 'Smart Medical Device Prototype with MAX30102 PPG pulse oximetry and ESP32 telemetry for real-time patient vital sign monitoring and automated medical alert transmission.'
  },
  {
    code: 'IGRID-AI-20',
    github_repo: 'https://github.com/igridlab-code/Smart-AI-Food-Monitoring-System',
    title: 'Smart AI Food Monitoring System',
    description: 'AI-based food freshness recognition and calorie estimation system using Raspberry Pi camera telemetry and Google Gemini AI multimodal analysis.'
  }
];

console.log(`🚀 Syncing ${githubMappings.length} matched GitHub repositories to SQLite...`);

db.serialize(() => {
  const stmt = db.prepare(`
    UPDATE projects SET
      github_repo = ?,
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      image_url = COALESCE(?, image_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE project_code = ?
  `);

  githubMappings.forEach(m => {
    stmt.run(m.github_repo, m.title, m.description, m.image_url || null, m.code, function(err) {
      if (err) console.error(`Error updating ${m.code}:`, err.message);
      else console.log(`✅ [${m.code}] Synced -> ${m.github_repo} ("${m.title}")`);
    });
  });

  stmt.finalize(() => {
    console.log('🎉 GITHUB SYNC COMPLETED SUCCESSFULLY!');
    db.close();
  });
});
