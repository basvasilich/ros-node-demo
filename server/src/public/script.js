// RX200 Robot Control Interface Script

// Configuration
const config = {
  // Default server URL - modify this to match your server
  serverUrl: 'http://192.168.64.3:3000',
  // Update interval for status checking (ms)
  statusInterval: 5000,
  // Default timeout for requests (ms)
  requestTimeout: 3000
};

// DOM Elements
const elements = {
  // Status indicators
  statusIndicator: document.getElementById('status-indicator'),
  feedbackMessage: document.getElementById('feedback-message'),
  connectionIndicator: document.getElementById('connection-indicator'),

  // Arm controls
  waistSlider: document.getElementById('waist'),
  waistValue: document.getElementById('waist-value'),
  shoulderSlider: document.getElementById('shoulder'),
  shoulderValue: document.getElementById('shoulder-value'),
  elbowSlider: document.getElementById('elbow'),
  elbowValue: document.getElementById('elbow-value'),
  wristAngleSlider: document.getElementById('wrist-angle'),
  wristAngleValue: document.getElementById('wrist-angle-value'),
  wristRotateSlider: document.getElementById('wrist-rotate'),
  wristRotateValue: document.getElementById('wrist-rotate-value'),


  // Buttons
  sendArmButton: document.getElementById('send-arm'),
  homePositionButton: document.getElementById('home-position'),
  openGripperButton: document.getElementById('open-gripper'),
  closeGripperButton: document.getElementById('close-gripper'),
  runDemoButton: document.getElementById('run-demo'),
  checkConnectionButton: document.getElementById('check-connection'),
};

// State management
const state = {
  connected: false,
  sequenceLength: 0,
  sequenceIndex: 0
};

// Initialize by connecting sliders to their numeric inputs
function initializeControls() {
  // Connect arm sliders to their value inputs
  connectSliderToInput(elements.waistSlider, elements.waistValue);
  connectSliderToInput(elements.shoulderSlider, elements.shoulderValue);
  connectSliderToInput(elements.elbowSlider, elements.elbowValue);
  connectSliderToInput(elements.wristAngleSlider, elements.wristAngleValue);
  connectSliderToInput(elements.wristRotateSlider, elements.wristRotateValue);
}

// Helper to connect a slider with its numeric input (bidirectional)
function connectSliderToInput(slider, input) {
  slider.addEventListener('input', () => {
    input.value = parseFloat(slider.value).toFixed(4);
  });

  input.addEventListener('input', () => {
    slider.value = input.value;
  });
}

// Check server connection
async function checkConnection() {
  try {
    updateConnectionStatus('Checking...', '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout);

    const response = await fetch(`${config.serverUrl}/status`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      state.connected = true;
      updateConnectionStatus('Connected', 'connected');
      elements.statusIndicator.textContent = 'Online';
      elements.statusIndicator.className = 'status-online';
      showFeedback(data.message || 'Server is online', 'success');
      return true;
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    state.connected = false;
    updateConnectionStatus('Disconnected', 'disconnected');
    elements.statusIndicator.textContent = 'Offline';
    elements.statusIndicator.className = 'status-offline';
    showFeedback(`Connection error: ${error.message}`, 'error');
    return false;
  }
}

// Update connection status UI
function updateConnectionStatus(text, className) {
  elements.connectionIndicator.textContent = text;
  elements.connectionIndicator.className = className;
}

// Send arm position command
async function sendArmCommand() {
  if (!state.connected) {
    showFeedback('Cannot send command: Server is not connected', 'error');
    return;
  }

  try {
    // Get positions from all arm sliders
    const positions = [
      parseFloat(elements.waistValue.value),
      parseFloat(elements.shoulderValue.value),
      parseFloat(elements.elbowValue.value),
      parseFloat(elements.wristAngleValue.value),
      parseFloat(elements.wristRotateValue.value)
    ];

    // Validate positions
    if (positions.some(isNaN)) {
      throw new Error('Invalid position values');
    }

    // Show sending feedback
    showFeedback('Sending arm command...', 'warning');

    // Send request to server
    const response = await fetch(`${config.serverUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'arm',
        positions,
        timeFromStart: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      showFeedback(`Arm command sent: ${JSON.stringify(positions.map(p => p.toFixed(2)))}`, 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to send arm command: ${error.message}`, 'error');
  }
}

// Send gripper position command
async function sendGripperCommand(command) {
  if (!state.connected) {
    showFeedback('Cannot send command: Server is not connected', 'error');
    return;
  }

  try {
    // Get position from gripper slider
    const position = parseFloat(command === 'open' ? 0.03 : 0);

    // Validate position
    if (isNaN(position)) {
      throw new Error('Invalid gripper position');
    }

    // Show sending feedback
    showFeedback('Sending gripper command...', 'warning');

    // Send request to server
    const response = await fetch(`${config.serverUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        positions: [position, -1 * position],
        type: 'gripper',
        timeFromStart: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      showFeedback(`Gripper command sent: ${position.toFixed(3)}`, 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to send gripper command: ${error.message}`, 'error');
  }
}

// Set home position
function setHomePosition() {
  // Set all arm controls to zero
  elements.waistSlider.value = 0;
  elements.waistValue.value = 0;
  elements.shoulderSlider.value = 0;
  elements.shoulderValue.value = 0;
  elements.elbowSlider.value = 0;
  elements.elbowValue.value = 0;
  elements.wristAngleSlider.value = 0;
  elements.wristAngleValue.value = 0;
  elements.wristRotateSlider.value = 0;
  elements.wristRotateValue.value = 0;

  // Send arm command to home position
  sendArmCommand();
}

// Set gripper to open position
function openGripper() {
  sendGripperCommand('open');
}

// Set gripper to closed position
function closeGripper() {
  sendGripperCommand('close');
}

// Run demo sequence
async function runDemoSequence() {
  if (!state.connected) {
    showFeedback('Cannot run demo: Server is not connected', 'error');
    return;
  }

  if (state.sequenceRunning) {
    showFeedback('A sequence is already running', 'warning');
    return;
  }

  try {
    showFeedback('Starting demo sequence...', 'warning');

    const response = await fetch(`${config.serverUrl}/sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        sequence: [
          {type: 'arm', positions: [0, 0, 0, 0, 0]},
          {type: 'gripper', positions: [0.03, -0.03]},
          {type: 'gripper', positions: [0, 0]},
          {type: 'arm', positions: [-1.5, 0, -1.3, -0.7, 1.8]},
          {type: 'arm', positions: [-1.5, 0, -1.3, 0.7, 1.8]},
          {type: 'arm', positions: [-1.5, 0, -1.3, -0.7, 1.8]},
          {type: 'arm', positions: [-1.5, 0, -1.3, 0.7, 1.8]},
          {type: 'arm', positions: [-1.5, 0, -1.3, 0, 1.8]},
          {type: 'gripper', positions: [0.03, -0.03]},
          {type: 'gripper', positions: [0, 0]},
          {type: 'arm', positions: [0, 0, 0, 0, 0]}
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      showFeedback('Demo sequence started', 'success');

    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to start demo: ${error.message}`, 'error');
  }
}

// Display feedback message with appropriate styling
function showFeedback(message, type = 'info') {
  elements.feedbackMessage.textContent = message;

  // Remove all classes
  elements.feedbackMessage.className = 'feedback';

  // Add class based on message type
  if (type === 'error') {
    elements.feedbackMessage.style.borderLeftColor = 'var(--error-color)';
  } else if (type === 'success') {
    elements.feedbackMessage.style.borderLeftColor = 'var(--success-color)';
  } else if (type === 'warning') {
    elements.feedbackMessage.style.borderLeftColor = 'var(--warning-color)';
  } else {
    elements.feedbackMessage.style.borderLeftColor = 'var(--accent-color)';
  }
}

// Set up event listeners
function setupEventListeners() {
  // Arm and gripper control buttons
  elements.sendArmButton.addEventListener('click', sendArmCommand);
  elements.homePositionButton.addEventListener('click', setHomePosition);
  elements.openGripperButton.addEventListener('click', openGripper);
  elements.closeGripperButton.addEventListener('click', closeGripper);

  // Sequence control
  elements.runDemoButton.addEventListener('click', runDemoSequence);

  // Connection management
  elements.checkConnectionButton.addEventListener('click', checkConnection);
}

// Initialize the interface
async function init() {
  initializeControls();
  setupEventListeners();
  await checkConnection();

  // Periodically check connection status
  setInterval(checkConnection, config.statusInterval);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);