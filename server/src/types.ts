// Time stamp type definition
export interface Time {
  sec: number;
  nanosec: number;
}

// Message header type definition
export interface Header {
  stamp: Time;
  frame_id: string;
}

// Joint trajectory point type definition
export interface JointTrajectoryPoint {
  positions: number[];
  velocities: number[];
  accelerations: number[];
  effort: number[];
  time_from_start: Time;
}

// Joint trajectory message type definition
export interface JointTrajectory {
  header: Header;
  joint_names: string[];
  points: JointTrajectoryPoint[];
}

// Type interfaces
export interface ArmCommand {
  positions: number[];
  time_from_start?: number;
}

export interface GripperCommand {
  position: number;
  time_from_start?: number;
}

export interface SequenceCommand {
  type: 'arm' | 'gripper';
  positions?: number[];
  position?: number;
  time_from_start?: number;
  delay?: number;
}

export interface TimeFromStart {
  sec: number;
  nanosec: number;
}

export interface Header {
  stamp: {
    sec: number;
    nanosec: number;
  };
  frame_id: string;
}

export interface JointTrajectoryPoint {
  positions: number[];
  velocities: number[];
  accelerations: number[];
  effort: number[];
  time_from_start: TimeFromStart;
}

export interface JointTrajectory {
  header: Header;
  joint_names: string[];
  points: JointTrajectoryPoint[];
}