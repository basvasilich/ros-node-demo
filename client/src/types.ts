export interface ArmCommand {
  type: 'arm' | 'gripper';
  positions: number[];
  timeFromStart?: number;
  delay?: number;
}


export interface ClientConfig {
  serverUrl: string;
  statusInterval: number;
  requestTimeout: number;
}

// DOM Elements interface
export interface DOMElements {
  // Status indicators
  statusIndicator: HTMLElement | null;
  feedbackMessage: HTMLElement | null;
  connectionIndicator: HTMLElement | null;

  // Arm controls
  waistSlider: HTMLInputElement | null;
  waistValue: HTMLInputElement | null;
  shoulderSlider: HTMLInputElement | null;
  shoulderValue: HTMLInputElement | null;
  elbowSlider: HTMLInputElement | null;
  elbowValue: HTMLInputElement | null;
  wristAngleSlider: HTMLInputElement | null;
  wristAngleValue: HTMLInputElement | null;
  wristRotateSlider: HTMLInputElement | null;
  wristRotateValue: HTMLInputElement | null;

  // Buttons
  sendArmButton: HTMLElement | null;
  homePositionButton: HTMLElement | null;
  openGripperButton: HTMLElement | null;
  closeGripperButton: HTMLElement | null;
  runDemoButton: HTMLElement | null;
  checkConnectionButton: HTMLElement | null;
}

// Application state interface
export interface ClientState {
  connected: boolean;
  sequenceRunning?: boolean;
  sequenceLength: number;
  sequenceIndex: number;
}