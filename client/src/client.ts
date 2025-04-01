import {ArmCommand, ClientConfig, DOMElements, ClientState} from "./types";

const config: ClientConfig = {
  serverUrl: 'http://192.168.1.102:3000',
  statusInterval: 5000,
  requestTimeout: 3000
};

function isHTMLInputElement(element: Element | null): element is HTMLInputElement {
  return element !== null && element.tagName === 'INPUT';
}

function getInputElement(id: string): HTMLInputElement | null {
  const element = document.getElementById(id);
  return isHTMLInputElement(element) ? element : null;
}

const elements: DOMElements = {
  statusIndicator: document.getElementById('status-indicator'),
  feedbackMessage: document.getElementById('feedback-message'),
  connectionIndicator: document.getElementById('connection-indicator'),

  waistSlider: getInputElement('waist'),
  waistValue: getInputElement('waist-value'),
  shoulderSlider: getInputElement('shoulder'),
  shoulderValue: getInputElement('shoulder-value'),
  elbowSlider: getInputElement('elbow'),
  elbowValue: getInputElement('elbow-value'),
  wristAngleSlider: getInputElement('wrist-angle'),
  wristAngleValue: getInputElement('wrist-angle-value'),
  wristRotateSlider: getInputElement('wrist-rotate'),
  wristRotateValue: getInputElement('wrist-rotate-value'),

  sendArmButton: document.getElementById('send-arm'),
  homePositionButton: document.getElementById('home-position'),
  openGripperButton: document.getElementById('open-gripper'),
  closeGripperButton: document.getElementById('close-gripper'),
  runDemoButton: document.getElementById('run-demo'),
  checkConnectionButton: document.getElementById('check-connection'),
};

const state: ClientState = {
  connected: false,
  sequenceRunning: false,
  sequenceLength: 0,
  sequenceIndex: 0
};

function initializeControls(): void {
  if (elements.waistSlider && elements.waistValue) {
    connectSliderToInput(elements.waistSlider, elements.waistValue);
  }

  if (elements.shoulderSlider && elements.shoulderValue) {
    connectSliderToInput(elements.shoulderSlider, elements.shoulderValue);
  }

  if (elements.elbowSlider && elements.elbowValue) {
    connectSliderToInput(elements.elbowSlider, elements.elbowValue);
  }

  if (elements.wristAngleSlider && elements.wristAngleValue) {
    connectSliderToInput(elements.wristAngleSlider, elements.wristAngleValue);
  }

  if (elements.wristRotateSlider && elements.wristRotateValue) {
    connectSliderToInput(elements.wristRotateSlider, elements.wristRotateValue);
  }
}

function connectSliderToInput(slider: HTMLInputElement, input: HTMLInputElement): void {
  slider.addEventListener('input', () => {
    input.value = parseFloat(slider.value).toFixed(4);
  });

  input.addEventListener('input', () => {
    slider.value = input.value;
  });
}

async function checkConnection(): Promise<boolean> {
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

      if (elements.statusIndicator) {
        elements.statusIndicator.textContent = 'Online';
        elements.statusIndicator.className = 'status-online';
      }

      showFeedback(data.message || 'Server is online', 'success');
      return true;
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    state.connected = false;
    updateConnectionStatus('Disconnected', 'disconnected');

    if (elements.statusIndicator) {
      elements.statusIndicator.textContent = 'Offline';
      elements.statusIndicator.className = 'status-offline';
    }

    showFeedback(`Connection error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

function updateConnectionStatus(text: string, className: string): void {
  if (elements.connectionIndicator) {
    elements.connectionIndicator.textContent = text;
    elements.connectionIndicator.className = className;
  }
}

async function sendArmCommand(): Promise<void> {
  if (!state.connected) {
    showFeedback('Cannot send command: Server is not connected', 'error');
    return;
  }

  try {

    if (!elements.waistValue || !elements.shoulderValue || !elements.elbowValue ||
      !elements.wristAngleValue || !elements.wristRotateValue) {
      throw new Error('UI elements not found');
    }

    const positions = [
      parseFloat(elements.waistValue.value),
      parseFloat(elements.shoulderValue.value),
      parseFloat(elements.elbowValue.value),
      parseFloat(elements.wristAngleValue.value),
      parseFloat(elements.wristRotateValue.value)
    ];


    if (positions.some(isNaN)) {
      throw new Error('Invalid position values');
    }


    showFeedback('Sending arm command...', 'warning');


    const command: ArmCommand = {
      type: 'arm',
      positions,
      timeFromStart: 1
    };

    const response = await fetch(`${config.serverUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    });

    if (response.ok) {
      await response.json();
      showFeedback(`Arm command sent: ${JSON.stringify(positions.map(p => parseFloat(p.toFixed(2))))}`, 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to send arm command: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

async function sendGripperCommand(command: 'open' | 'close'): Promise<void> {
  if (!state.connected) {
    showFeedback('Cannot send command: Server is not connected', 'error');
    return;
  }

  try {

    const position = command === 'open' ? 0.03 : 0;


    showFeedback('Sending gripper command...', 'warning');


    const gripperCommand: ArmCommand = {
      type: 'gripper',
      positions: [position, -position],
      timeFromStart: 1
    };

    const response = await fetch(`${config.serverUrl}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gripperCommand)
    });

    if (response.ok) {
      await response.json();
      showFeedback(`Gripper command sent: ${position.toFixed(3)}`, 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to send gripper command: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

function setHomePosition(): void {

  if (elements.waistSlider && elements.waistValue) {
    elements.waistSlider.value = '0';
    elements.waistValue.value = '0';
  }
  if (elements.shoulderSlider && elements.shoulderValue) {
    elements.shoulderSlider.value = '0';
    elements.shoulderValue.value = '0';
  }
  if (elements.elbowSlider && elements.elbowValue) {
    elements.elbowSlider.value = '0';
    elements.elbowValue.value = '0';
  }
  if (elements.wristAngleSlider && elements.wristAngleValue) {
    elements.wristAngleSlider.value = '0';
    elements.wristAngleValue.value = '0';
  }
  if (elements.wristRotateSlider && elements.wristRotateValue) {
    elements.wristRotateSlider.value = '0';
    elements.wristRotateValue.value = '0';
  }


  sendArmCommand();
}

function openGripper(): void {
  sendGripperCommand('open');
}

function closeGripper(): void {
  sendGripperCommand('close');
}

async function runDemoSequence(): Promise<void> {
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

    const demoSequence: ArmCommand[] = [
      {type: 'arm', positions: [0, 0, 0, 0, 0], timeFromStart: 1},
      {type: 'arm', positions: [-1.5, 0, -1.3, -0.7, 1.8], timeFromStart: 1},
      {type: 'arm', positions: [-1.5, 0, -1.3, 0.7, 1.8], timeFromStart: 1},
      {type: 'arm', positions: [-1.5, 0, -1.3, -0.7, 1.8], timeFromStart: 1},
      {type: 'arm', positions: [-1.5, 0, -1.3, 0.7, 1.8], timeFromStart: 1},
      {type: 'arm', positions: [-1.5, 0, -1.3, 0, 1.8], timeFromStart: 1},
      {type: 'arm', positions: [0, 0, 0, 0, 0], timeFromStart: 1}
    ];

    const response = await fetch(`${config.serverUrl}/sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sequence: demoSequence })
    });

    if (response.ok) {
      await response.json();
      showFeedback('Demo sequence started', 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    showFeedback(`Failed to start demo: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

function showFeedback(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  if (!elements.feedbackMessage) return;

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

function setupEventListeners(): void {
  elements.sendArmButton?.addEventListener('click', sendArmCommand);
  elements.homePositionButton?.addEventListener('click', setHomePosition);
  elements.openGripperButton?.addEventListener('click', openGripper);
  elements.closeGripperButton?.addEventListener('click', closeGripper);

  elements.runDemoButton?.addEventListener('click', runDemoSequence);
  elements.checkConnectionButton?.addEventListener('click', checkConnection);
}

async function init(): Promise<void> {
  initializeControls();
  setupEventListeners();
  await checkConnection();

  setInterval(checkConnection, config.statusInterval);
}


document.addEventListener('DOMContentLoaded', init);