export interface ArmCommand {
  type: 'arm' | 'gripper';
  positions: number[];
  timeFromStart?: number;
  delay?: number;
}