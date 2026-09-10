/**
 * CampusAR Navigator — Main Application Controller
 * Handles Camera Feed, API communication, Agent NLP Queries, Mini-Map Radar, and Step Guidance.
 * Features:
 * - Real-time distance counter in meters (hero display & 3D billboard)
 * - "You have arrived" celebratory popup at each waypoint
 * - Route visualization on radar minimap with numbered waypoints & user FOV cone
 * - Mobile-first vertical layout optimization
 */

class CampusARApp {
  constructor() {
    this.campusData = null;
    this.liveStatuses = {};
    this.nodesMap = {};
    this.arView = null;

    // Navigation State
    this.currentRoute = null;
    this.currentStepIndex = 0;
    this.userPos = { x: 0, y: 0 }; // Start at Gate 1 (0, 0)
    this.simulatedHeading = 0;
    this.isUsingRealCamera = true;
    this.isMapExpanded = false;

    // Mini-map State
    this.mapCanvas = document.getElementById('minimap-canvas');
    this.mapCtx = this.mapCanvas ? this.mapCanvas.getContext('2d') : null;

    this.init();
  }

  async init() {
    // 1. Initialize Three.js AR View
    this.arView = new ARView('ar-canvas');

    // 2. Initialize Camera Feed
    await this.setupCameraFeed();

    // 3. Fetch Campus Topology and Live Statuses
    await this.loadCampusData();
    await this.loadLiveStatuses();

    // 4. Setup UI Listeners
    this.setupEventListeners();

    // 5. On mobile, collapse simulator card by default
    if (window.innerWidth <= 600) {
      const simCard = document.getElementById('simulator-card');
      if (simCard) simCard.classList.add('collapsed');
    }

    // 6. Initial Mini-Map Draw
    this.renderMiniMap();

    console.log("CampusAR Navigator successfully initialized.");
  }

  async setupCameraFeed() {
    const videoElem = document.getElementById('camera-feed');
    const simBg = document.getElementById('simulated-camera-bg');
    const camLabel = document.getElementById('cam-label');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported on this browser/environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      videoElem.srcObject = stream;
      await videoElem.play();
      this.isUsingRealCamera = true;
      if (simBg) simBg.classList.add('hidden');
      if (camLabel) camLabel.textContent = "Camera";
    } catch (err) {
      console.warn("Camera access unavailable or declined, using simulated campus background:", err.message);
      this.isUsingRealCamera = false;
      if (simBg) simBg.classList.remove('hidden');
      if (videoElem) videoElem.style.display = 'none';
      if (camLabel) camLabel.textContent = "Sim Grid";
    }
  }

  toggleCameraMode() {
    const videoElem = document.getElementById('camera-feed');
    const simBg = document.getElementById('simulated-camera-bg');
    const camLabel = document.getElementById('cam-label');

    this.isUsingRealCamera = !this.isUsingRealCamera;

    if (this.isUsingRealCamera) {
      if (videoElem) videoElem.style.display = 'block';
      if (simBg) simBg.classList.add('hidden');
      if (camLabel) camLabel.textContent = "Camera";
      this.setupCameraFeed();
    } else {
      if (videoElem) {
        videoElem.style.display = 'none';
        if (videoElem.srcObject) {
          videoElem.srcObject.getTracks().forEach(t => t.stop());
        }
      }
      if (simBg) simBg.classList.remove('hidden');
      if (camLabel) camLabel.textContent = "Sim Grid";
    }
  }

  async loadCampusData() {
    try {
      const res = await fetch('/api/campus/data');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      this.campusData = await res.json();

      this.nodesMap = {};
      this.campusData.nodes.forEach(node => {
        this.nodesMap[node.id] = node;
      });

      this.populateSelectOptions();
    } catch (err) {
      console.error("Failed to load campus data:", err);
    }
  }

  async loadLiveStatuses() {
    try {
      const res = await fetch('/api/campus/status');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      this.liveStatuses = data.statuses || {};
      this.updateActiveWaypointStatus();
    } catch (err) {
      console.error("Failed to load live statuses:", err);
    }
  }

  populateSelectOptions() {
    const startSelect = document.getElementById('start-select');
    const destSelect = document.getElementById('dest-select');
    if (!startSelect || !destSelect || !this.campusData) return;

    startSelect.innerHTML = '';
    destSelect.innerHTML = '';

    // Group nodes by category
    const categories = {
      entrance: "Gates & Entrances",
      academic: "Academic & Labs",
      food: "Food & Dining",
      facility: "Facilities & Offices",
      sports: "Sports & Recreation",
      residential: "Hostels & Living",
      parking: "Parking"
    };

    const grouped = {};
    this.campusData.nodes.forEach(node => {
      const cat = node.category || 'facility';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(node);
    });

    for (const [catKey, groupNodes] of Object.entries(grouped)) {
      const optGroup1 = document.createElement('optgroup');
      optGroup1.label = categories[catKey] || catKey;

      const optGroup2 = document.createElement('optgroup');
      optGroup2.label = categories[catKey] || catKey;

      groupNodes.forEach(node => {
        const opt1 = new Option(node.name, node.id);
        const opt2 = new Option(node.name, node.id);
        optGroup1.appendChild(opt1);
        optGroup2.appendChild(opt2);
      });

      startSelect.appendChild(optGroup1);
      destSelect.appendChild(optGroup2);
    }

    // Default: Start at Gate 1, Destination CS Lab
    startSelect.value = "gate_1";
    destSelect.value = "cs_lab";
  }

  setupEventListeners() {
    // 1. Camera Toggle
    const camBtn = document.getElementById('cam-toggle-btn');
    if (camBtn) camBtn.addEventListener('click', () => this.toggleCameraMode());

    // 2. Manual Route Form Toggle
    const routePanel = document.getElementById('route-panel');
    const routeToggle = document.getElementById('route-panel-toggle');
    if (routeToggle && routePanel) {
      routeToggle.addEventListener('click', () => {
        routePanel.classList.toggle('collapsed');
      });
    }

    // 3. Find Route Button
    const findRouteBtn = document.getElementById('find-route-btn');
    if (findRouteBtn) {
      findRouteBtn.addEventListener('click', () => {
        const startId = document.getElementById('start-select').value;
        const destId = document.getElementById('dest-select').value;
        this.fetchAndStartRoute(startId, destId);
      });
    }

    // 4. AI Agent Query Input & Button
    const agentInput = document.getElementById('agent-query-input');
    const agentBtn = document.getElementById('agent-send-btn');
    if (agentBtn && agentInput) {
      const triggerAgent = () => {
        const query = agentInput.value.trim();
        if (query) this.handleAgentQuery(query);
      };
      agentBtn.addEventListener('click', triggerAgent);
      agentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerAgent();
      });
    }

    // 5. Quick Suggestion Chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (agentInput) agentInput.value = query;
        this.handleAgentQuery(query);
      });
    });

    // 6. Navigation Controls
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const cancelBtn = document.getElementById('cancel-nav-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
    if (nextBtn) nextBtn.addEventListener('click', () => this.handleNextStepArrival());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.stopNavigation());

    // 7. Arrival Modal Actions
    const arrivalNextBtn = document.getElementById('arrival-next-btn');
    if (arrivalNextBtn) {
      arrivalNextBtn.addEventListener('click', () => {
        this.closeArrivalModalAndProceed();
      });
    }

    // 8. Desktop Simulator Controls
    const slider = document.getElementById('heading-slider');
    const sliderVal = document.getElementById('slider-heading-val');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const deg = parseFloat(e.target.value);
        this.simulatedHeading = deg;
        if (sliderVal) sliderVal.textContent = `${Math.round(deg)}°`;
        if (this.arView) this.arView.setDeviceHeading(deg);
        this.renderMiniMap();
      });
    }

    const walkBtn = document.getElementById('sim-walk-btn');
    if (walkBtn) {
      walkBtn.addEventListener('click', () => this.simulateWalkingStep());
    }

    const calibrateBtn = document.getElementById('calibrate-btn');
    if (calibrateBtn) {
      calibrateBtn.addEventListener('click', () => {
        if (slider) slider.value = 0;
        if (sliderVal) sliderVal.textContent = '0°';
        if (this.arView) this.arView.setDeviceHeading(0);
        this.renderMiniMap();
      });
    }

    // 9. Simulator Minimize/Expand Toggle
    const simHeaderToggle = document.getElementById('sim-header-toggle');
    const simCard = document.getElementById('simulator-card');
    if (simHeaderToggle && simCard) {
      simHeaderToggle.addEventListener('click', () => {
        simCard.classList.toggle('collapsed');
      });
    }

    // 10. Minimap Expand / Collapse Button
    const expandMapBtn = document.getElementById('toggle-expand-map-btn');
    const minimapContainer = document.getElementById('minimap-container');
    if (expandMapBtn && minimapContainer) {
      expandMapBtn.addEventListener('click', () => {
        this.isMapExpanded = !this.isMapExpanded;
        minimapContainer.classList.toggle('expanded', this.isMapExpanded);
        expandMapBtn.textContent = this.isMapExpanded ? '✕' : '⛶';
        // Resize canvas resolution if expanded
        if (this.isMapExpanded) {
          this.mapCanvas.width = minimapContainer.clientWidth;
          this.mapCanvas.height = minimapContainer.clientHeight - 40;
        } else {
          this.mapCanvas.width = 240;
          this.mapCanvas.height = 120;
        }
        this.renderMiniMap();
      });
    }

    // 11. Recenter Map
    const recenterBtn = document.getElementById('recenter-map-btn');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => this.renderMiniMap());
    }

    // 12. Close Itinerary Drawer
    const closeItineraryBtn = document.getElementById('close-itinerary-btn');
    if (closeItineraryBtn) {
      closeItineraryBtn.addEventListener('click', () => {
        document.getElementById('agent-itinerary-card').classList.add('hidden');
      });
    }

    // 13. POI Modal Close
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        document.getElementById('poi-modal').classList.add('hidden');
      });
    }

    // 14. Mini-Map Click to inspect POI
    if (this.mapCanvas) {
      this.mapCanvas.addEventListener('click', (e) => this.handleMiniMapClick(e));
    }
  }

  async fetchAndStartRoute(startId, destId) {
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_node_id: startId, destination_node_id: destId })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Could not find a route.");
        return;
      }

      this.startNavigation(data);
    } catch (err) {
      console.error("Error calculating route:", err);
      alert("Network error computing route.");
    }
  }

  async handleAgentQuery(query) {
    const agentBtn = document.getElementById('agent-send-btn');
    if (agentBtn) agentBtn.disabled = true;

    try {
      let closestNodeId = "gate_1";
      if (this.currentRoute && this.currentRoute.waypoints[this.currentStepIndex]) {
        closestNodeId = this.currentRoute.waypoints[this.currentStepIndex].node_id;
      }

      const res = await fetch('/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          current_node_id: closestNodeId
        })
      });

      const data = await res.json();
      if (!data.success) {
        if (data.clarification_needed) {
          const card = document.getElementById('agent-itinerary-card');
          const summary = document.getElementById('agent-itinerary-summary');
          const stopsList = document.getElementById('itinerary-stops-list');
          if (card && summary && stopsList) {
            summary.innerHTML = `<strong style="color:#fbbf24;">❓ Clarification Needed:</strong> ${data.clarification_question}`;
            stopsList.innerHTML = '';
            if (data.suggestions && data.suggestions.length > 0) {
              data.suggestions.forEach(sId => {
                const node = this.nodesMap[sId];
                if (node) {
                  const btn = document.createElement('button');
                  btn.className = 'chip';
                  btn.style.margin = '4px 4px 0 0';
                  btn.textContent = `📍 ${node.name}`;
                  btn.onclick = () => {
                    document.getElementById('agent-query-input').value = `go to ${node.name}`;
                    this.handleAgentQuery(`go to ${node.name}`);
                  };
                  stopsList.appendChild(btn);
                }
              });
            }
            card.classList.remove('hidden');
          }
          return;
        }
        alert(data.agent_summary || "Agent could not resolve destinations.");
        return;
      }

      this.displayAgentItinerary(data);

      const compositeRoute = {
        success: true,
        start_node: closestNodeId,
        destination_node: data.recognized_stops[data.recognized_stops.length - 1].id,
        total_distance_meters: data.total_distance_meters,
        estimated_walking_time_minutes: Math.round(data.total_distance_meters / 75),
        waypoints: data.combined_waypoints
      };

      this.startNavigation(compositeRoute);
    } catch (err) {
      console.error("Agent query failed:", err);
      alert("Failed to communicate with Campus AI Agent.");
    } finally {
      if (agentBtn) agentBtn.disabled = false;
    }
  }

  displayAgentItinerary(agentData) {
    const card = document.getElementById('agent-itinerary-card');
    const summary = document.getElementById('agent-itinerary-summary');
    const stopsList = document.getElementById('itinerary-stops-list');
    if (!card || !summary || !stopsList) return;

    summary.textContent = agentData.agent_summary;
    stopsList.innerHTML = '';

    agentData.recognized_stops.forEach((stop, idx) => {
      const st = this.liveStatuses[stop.id] || { status: 'Normal', metric_value: 'Accessible', badge_color: 'emerald' };
      const item = document.createElement('div');
      item.className = 'itinerary-leg-item';
      item.innerHTML = `
        <div class="leg-number">${idx + 1}</div>
        <div class="leg-info">
          <div class="leg-title">${stop.name}</div>
          <div class="leg-sub">${st.metric_label || 'Status'}: <strong>${st.metric_value}</strong> (${st.status})</div>
        </div>
        <span class="status-pill ${st.badge_color || 'emerald'}">${st.status}</span>
      `;
      stopsList.appendChild(item);
    });

    card.classList.remove('hidden');
  }

  startNavigation(routeData) {
    this.currentRoute = routeData;
    this.currentStepIndex = 0;

    const startNode = this.nodesMap[routeData.start_node] || routeData.waypoints[0];
    if (startNode) {
      this.userPos = { x: startNode.x, y: startNode.y };
    }

    // Collapse manual form
    const routePanel = document.getElementById('route-panel');
    if (routePanel) routePanel.classList.add('collapsed');

    // Show active nav HUD & Distance Hero
    const navHud = document.getElementById('navigation-hud');
    const distanceHero = document.getElementById('ar-distance-hero');
    if (navHud) navHud.classList.remove('hidden');
    if (distanceHero) distanceHero.classList.remove('hidden');

    this.updateNavigationUI();
    this.renderMiniMap();
  }

  stopNavigation() {
    this.currentRoute = null;
    this.currentStepIndex = 0;

    const navHud = document.getElementById('navigation-hud');
    const distanceHero = document.getElementById('ar-distance-hero');
    const itineraryCard = document.getElementById('agent-itinerary-card');
    const arrivalModal = document.getElementById('arrival-modal');

    if (navHud) navHud.classList.add('hidden');
    if (distanceHero) distanceHero.classList.add('hidden');
    if (itineraryCard) itineraryCard.classList.add('hidden');
    if (arrivalModal) arrivalModal.classList.add('hidden');

    if (this.arView) {
      this.arView.setWaypointTarget(null, this.userPos);
    }

    this.renderMiniMap();
  }

  handleNextStepArrival() {
    if (!this.currentRoute) return;
    const waypoints = this.currentRoute.waypoints;
    const isFinalStep = (this.currentStepIndex >= waypoints.length - 1);

    // Target waypoint arrived at
    const arrivedWp = isFinalStep ? waypoints[waypoints.length - 1] : waypoints[this.currentStepIndex + 1];
    this.showArrivalPopup(arrivedWp, isFinalStep);
  }

  showArrivalPopup(waypoint, isFinal) {
    const modal = document.getElementById('arrival-modal');
    const iconElem = document.getElementById('arrival-icon');
    const badgeElem = document.getElementById('arrival-badge');
    const titleElem = document.getElementById('arrival-title');
    const subtitleElem = document.getElementById('arrival-subtitle');
    const statusBox = document.getElementById('arrival-status-box');
    const nextBtnLabel = document.getElementById('arrival-next-label');

    if (!modal) return;

    // Trigger 3D celebration pulse
    if (this.arView) {
      this.arView.triggerArrivalCelebration();
    }

    const st = this.liveStatuses[waypoint.node_id] || {
      status: 'Open',
      metric_label: 'Status',
      metric_value: 'Accessible',
      badge_color: 'emerald',
      notes: 'Normal campus operation'
    };

    if (isFinal) {
      if (iconElem) iconElem.textContent = '🎉';
      if (badgeElem) {
        badgeElem.textContent = 'FINAL DESTINATION REACHED';
        badgeElem.style.color = '#38bdf8';
        badgeElem.style.borderColor = '#38bdf8';
      }
      if (titleElem) titleElem.textContent = `You have arrived at ${waypoint.name}!`;
      if (subtitleElem) subtitleElem.textContent = `Journey complete! All stops successfully reached.`;
      if (nextBtnLabel) nextBtnLabel.textContent = 'Complete Navigation 🎉';
    } else {
      if (iconElem) iconElem.textContent = '🎯';
      if (badgeElem) {
        badgeElem.textContent = 'WAYPOINT REACHED';
        badgeElem.style.color = '#34d399';
        badgeElem.style.borderColor = '#34d399';
      }
      if (titleElem) titleElem.textContent = `You have arrived at ${waypoint.name}!`;
      if (subtitleElem) subtitleElem.textContent = `Step ${this.currentStepIndex + 1} of ${this.currentRoute.waypoints.length} completed.`;
      
      const nextNextWp = this.currentRoute.waypoints[this.currentStepIndex + 2];
      const nextName = nextNextWp ? nextNextWp.name : "Next Waypoint";
      if (nextBtnLabel) nextBtnLabel.textContent = `Continue to ${nextName.substring(0, 18)} ▶`;
    }

    if (statusBox) {
      statusBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:11.5px; color:#94a3b8;">${st.metric_label}: <strong style="color:#f8fafc;">${st.metric_value}</strong></span>
          <span class="status-pill ${st.badge_color || 'emerald'}">${st.status}</span>
        </div>
        <p style="font-size:11px; color:#64748b; font-style:italic;">${st.notes}</p>
      `;
    }

    modal.classList.remove('hidden');
  }

  closeArrivalModalAndProceed() {
    const modal = document.getElementById('arrival-modal');
    if (modal) modal.classList.add('hidden');

    if (!this.currentRoute) return;

    if (this.currentStepIndex < this.currentRoute.waypoints.length - 1) {
      this.currentStepIndex++;
      const currWp = this.currentRoute.waypoints[this.currentStepIndex];
      this.userPos = { x: currWp.x, y: currWp.y };
      this.updateNavigationUI();
      this.renderMiniMap();
    } else {
      this.stopNavigation();
    }
  }

  previousStep() {
    if (!this.currentRoute || this.currentStepIndex <= 0) return;
    this.currentStepIndex--;
    const currWp = this.currentRoute.waypoints[this.currentStepIndex];
    this.userPos = { x: currWp.x, y: currWp.y };
    this.updateNavigationUI();
    this.renderMiniMap();
  }

  simulateWalkingStep() {
    if (!this.currentRoute) {
      this.userPos.y += 10;
      this.renderMiniMap();
      return;
    }

    const waypoints = this.currentRoute.waypoints;
    const targetWp = waypoints[this.currentStepIndex + 1] || waypoints[this.currentStepIndex];

    const dx = targetWp.x - this.userPos.x;
    const dy = targetWp.y - this.userPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 14) {
      // Close enough to trigger arrival!
      this.handleNextStepArrival();
    } else {
      // Walk 14 meters toward next waypoint
      const stepDist = 14;
      this.userPos.x += (dx / dist) * stepDist;
      this.userPos.y += (dy / dist) * stepDist;

      // Update distance counter and AR view
      this.updateDistanceCounter(targetWp);
      if (this.arView) {
        this.arView.setWaypointTarget(targetWp, this.userPos);
      }
      this.renderMiniMap();
    }
  }

  updateDistanceCounter(targetWp) {
    if (!targetWp) return;
    const dx = targetWp.x - this.userPos.x;
    const dy = targetWp.y - this.userPos.y;
    const distMeters = Math.round(Math.hypot(dx, dy));

    const heroVal = document.getElementById('hero-distance-val');
    const heroSub = document.getElementById('hero-distance-sub');
    const stepDistElem = document.getElementById('step-dist');

    if (heroVal) heroVal.textContent = distMeters;
    if (heroSub) heroSub.textContent = `to ${targetWp.name}`;
    if (stepDistElem) stepDistElem.textContent = `${distMeters}m`;
  }

  updateNavigationUI() {
    if (!this.currentRoute) return;

    const waypoints = this.currentRoute.waypoints;
    const totalSteps = waypoints.length;
    const currWp = waypoints[this.currentStepIndex];
    const isLast = (this.currentStepIndex === totalSteps - 1);
    const targetWp = isLast ? currWp : waypoints[this.currentStepIndex + 1];

    // 1. Step labels and progress
    const stepLabel = document.getElementById('nav-step-label');
    if (stepLabel) stepLabel.textContent = `Step ${this.currentStepIndex + 1} of ${totalSteps}`;

    const progressFill = document.getElementById('step-progress-fill');
    if (progressFill) {
      const pct = Math.round(((this.currentStepIndex + 1) / totalSteps) * 100);
      progressFill.style.width = `${pct}%`;
    }

    // 2. Remaining Distance and Time calculation
    let remainingDist = 0;
    for (let i = this.currentStepIndex; i < waypoints.length - 1; i++) {
      remainingDist += waypoints[i].distance_to_next;
    }
    const remainingDistElem = document.getElementById('nav-remaining-dist');
    const remainingTimeElem = document.getElementById('nav-remaining-time');
    if (remainingDistElem) remainingDistElem.textContent = `${Math.round(remainingDist)}m`;
    if (remainingTimeElem) remainingTimeElem.textContent = `~${Math.max(1, Math.round(remainingDist / 75))} min`;

    // 3. Instruction Text & Bearing
    const instructionTitle = document.getElementById('instruction-title');
    const stepBearingElem = document.getElementById('step-bearing');
    const turnSymbol = document.getElementById('turn-symbol');

    if (instructionTitle) instructionTitle.textContent = currWp.instruction;
    if (stepBearingElem) stepBearingElem.textContent = `${Math.round(currWp.bearing_to_next_degrees)}°`;

    if (turnSymbol) {
      if (isLast) turnSymbol.textContent = '🏁';
      else if (currWp.bearing_to_next_degrees >= 45 && currWp.bearing_to_next_degrees <= 135) turnSymbol.textContent = '↗️';
      else if (currWp.bearing_to_next_degrees > 135 && currWp.bearing_to_next_degrees <= 225) turnSymbol.textContent = '⬇️';
      else if (currWp.bearing_to_next_degrees > 225 && currWp.bearing_to_next_degrees <= 315) turnSymbol.textContent = '↖️';
      else turnSymbol.textContent = '⬆️';
    }

    // 4. Update Prominent Distance Hero
    this.updateDistanceCounter(targetWp);

    // 5. Update Prev / Next buttons
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    if (prevBtn) prevBtn.disabled = (this.currentStepIndex === 0);
    if (nextBtn) nextBtn.textContent = isLast ? "Finish 🎉" : "Next Waypoint ▶";

    // 6. Update AR 3D Arrow Target
    if (this.arView) {
      this.arView.setWaypointTarget(targetWp, this.userPos);
    }

    // 7. Update Live Status for target waypoint
    this.updateActiveWaypointStatus(targetWp.node_id);
  }

  updateActiveWaypointStatus(nodeId) {
    if (!nodeId && this.currentRoute) {
      const waypoints = this.currentRoute.waypoints;
      const targetWp = waypoints[this.currentStepIndex + 1] || waypoints[this.currentStepIndex];
      nodeId = targetWp ? targetWp.node_id : null;
    }
    if (!nodeId) nodeId = "cs_lab";

    const st = this.liveStatuses[nodeId];
    const node = this.nodesMap[nodeId];
    if (!st || !node) return;

    const nodeNameElem = document.getElementById('status-node-name');
    const pillElem = document.getElementById('status-pill');
    const metricLabelElem = document.getElementById('status-metric-label');
    const metricValElem = document.getElementById('status-metric-value');
    const notesElem = document.getElementById('status-notes');

    if (nodeNameElem) nodeNameElem.textContent = node.name;
    if (pillElem) {
      pillElem.className = `status-pill ${st.badge_color || 'emerald'}`;
      pillElem.textContent = st.status;
    }
    if (metricLabelElem) metricLabelElem.textContent = `${st.metric_label}:`;
    if (metricValElem) metricValElem.textContent = st.metric_value;
    if (notesElem) notesElem.textContent = st.notes;
  }

  renderMiniMap() {
    if (!this.mapCtx || !this.campusData) return;
    const ctx = this.mapCtx;
    const width = this.mapCanvas.width;
    const height = this.mapCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate transformation from Campus Metric meters to MiniMap canvas pixels
    const bounds = this.campusData.campus_bounds;
    const campusWidth = bounds.max_x - bounds.min_x;
    const campusHeight = bounds.max_y - bounds.min_y;

    const pad = 14;
    const scaleX = (width - pad * 2) / campusWidth;
    const scaleY = (height - pad * 2) / campusHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (width - campusWidth * scale) / 2;
    const offsetY = (height - campusHeight * scale) / 2;

    const toCanvasX = (x) => offsetX + (x - bounds.min_x) * scale;
    const toCanvasY = (y) => height - offsetY - (y - bounds.min_y) * scale;

    // 1. Draw Campus Pathway Edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    this.campusData.edges.forEach(edge => {
      const src = this.nodesMap[edge.source];
      const tgt = this.nodesMap[edge.target];
      if (src && tgt) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(src.x), toCanvasY(src.y));
        ctx.lineTo(toCanvasX(tgt.x), toCanvasY(tgt.y));
        ctx.stroke();
      }
    });
    ctx.setLineDash([]); // reset

    // 2. Draw Active Route Polyline if navigating
    if (this.currentRoute && this.currentRoute.waypoints.length > 1) {
      // Glow underlay
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 8.0;
      ctx.beginPath();
      this.currentRoute.waypoints.forEach((wp, idx) => {
        const cx = toCanvasX(wp.x);
        const cy = toCanvasY(wp.y);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Main vibrant line
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      this.currentRoute.waypoints.forEach((wp, idx) => {
        const cx = toCanvasX(wp.x);
        const cy = toCanvasY(wp.y);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Draw numbered waypoint markers along the route
      this.currentRoute.waypoints.forEach((wp, idx) => {
        const cx = toCanvasX(wp.x);
        const cy = toCanvasY(wp.y);
        const isStart = (idx === 0);
        const isEnd = (idx === this.currentRoute.waypoints.length - 1);
        const isCurrent = (idx === this.currentStepIndex);

        ctx.beginPath();
        ctx.arc(cx, cy, isCurrent ? 7.5 : 5.5, 0, Math.PI * 2);

        if (isCurrent) {
          ctx.fillStyle = '#00f2fe';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isEnd) {
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isStart) {
          ctx.fillStyle = '#8b5cf6';
          ctx.fill();
        } else {
          ctx.fillStyle = '#0284c7';
          ctx.fill();
        }

        // Draw small step number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, cx, cy);
      });
    }

    // 3. Draw All Campus Nodes (as subtle context dots)
    this.campusData.nodes.forEach(node => {
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);

      ctx.beginPath();
      ctx.arc(cx, cy, 3.0, 0, Math.PI * 2);

      if (node.category === 'food') ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
      else if (node.category === 'academic') ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      else if (node.category === 'admin') ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
      else if (node.category === 'entrance') ctx.fillStyle = 'rgba(139, 92, 246, 0.75)';
      else ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';

      ctx.fill();
    });

    // 4. Draw User Position & Direction Cone
    const userCx = toCanvasX(this.userPos.x);
    const userCy = toCanvasY(this.userPos.y);

    // Direction cone (Flashlight / FOV)
    const headingRad = (this.arView ? this.arView.deviceHeading : 0) * (Math.PI / 180);
    const coneDist = 20;
    const coneAngle = 0.55; // radians

    const gradient = ctx.createRadialGradient(userCx, userCy, 2, userCx, userCy, coneDist);
    gradient.addColorStop(0, 'rgba(0, 242, 254, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(userCx, userCy);
    ctx.arc(userCx, userCy, coneDist, -Math.PI / 2 + headingRad - coneAngle, -Math.PI / 2 + headingRad + coneAngle);
    ctx.closePath();
    ctx.fill();

    // User center dot with pulse
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(userCx, userCy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  handleMiniMapClick(e) {
    if (!this.campusData) return;
    const rect = this.mapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const bounds = this.campusData.campus_bounds;
    const campusWidth = bounds.max_x - bounds.min_x;
    const campusHeight = bounds.max_y - bounds.min_y;

    const pad = 14;
    const scaleX = (this.mapCanvas.width - pad * 2) / campusWidth;
    const scaleY = (this.mapCanvas.height - pad * 2) / campusHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (this.mapCanvas.width - campusWidth * scale) / 2;
    const offsetY = (this.mapCanvas.height - campusHeight * scale) / 2;

    const toCanvasX = (x) => offsetX + (x - bounds.min_x) * scale;
    const toCanvasY = (y) => this.mapCanvas.height - offsetY - (y - bounds.min_y) * scale;

    let closest = null;
    let minDist = 16;

    this.campusData.nodes.forEach(node => {
      const cx = toCanvasX(node.x);
      const cy = toCanvasY(node.y);
      const d = Math.hypot(cx - clickX, cy - clickY);
      if (d < minDist) {
        minDist = d;
        closest = node;
      }
    });

    if (closest) {
      this.showPoiModal(closest);
    }
  }

  showPoiModal(node) {
    const modal = document.getElementById('poi-modal');
    const nameElem = document.getElementById('modal-poi-name');
    const descElem = document.getElementById('modal-poi-desc');
    const statusBox = document.getElementById('modal-status-box');
    const routeBtn = document.getElementById('modal-route-here-btn');

    if (!modal) return;

    if (nameElem) nameElem.textContent = node.name;
    if (descElem) descElem.textContent = node.description;

    const st = this.liveStatuses[node.id] || { status: 'Open', metric_value: 'Accessible', badge_color: 'emerald', notes: '' };
    if (statusBox) {
      statusBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:11px; color:#94a3b8;">${st.metric_label || 'Status'}: <strong>${st.metric_value}</strong></span>
          <span class="status-pill ${st.badge_color || 'emerald'}">${st.status}</span>
        </div>
        <p style="font-size:11px; color:#64748b;">${st.notes}</p>
      `;
    }

    if (routeBtn) {
      routeBtn.onclick = () => {
        modal.classList.add('hidden');
        let startId = "gate_1";
        if (this.currentRoute && this.currentRoute.waypoints[this.currentStepIndex]) {
          startId = this.currentRoute.waypoints[this.currentStepIndex].node_id;
        }
        this.fetchAndStartRoute(startId, node.id);
      };
    }

    modal.classList.remove('hidden');
  }
}

// Boot application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CampusARApp();
});
