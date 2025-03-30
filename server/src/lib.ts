import * as rclnodejs from 'rclnodejs';
import {SequenceCommand, JointTrajectory} from "./types";

export function createArmTrajectoryMessage(positions: number[], timeFromStart: number = 1): JointTrajectory {
  // Check input data
  if (!positions || !Array.isArray(positions) || positions.length !== 5) {
    throw new Error('Invalid data format. Positions must be an array of 5 values [waist, shoulder, elbow, wrist_angle, wrist_rotate]');
  }

  // Create message for arm control
  return {
    header: {
      stamp: {
        sec: 0,
        nanosec: 0
      },
      frame_id: ''
    },
    joint_names: ['waist', 'shoulder', 'elbow', 'wrist_angle', 'wrist_rotate'],
    points: [
      {
        positions: positions,
        velocities: [],
        accelerations: [],
        effort: [],
        time_from_start: {
          sec: Math.floor(timeFromStart),
          nanosec: Math.floor((timeFromStart - Math.floor(timeFromStart)) * 1000000000)
        }
      }
    ]
  };
}

export function createGripperTrajectoryMessage(position: number, timeFromStart: number = 1): JointTrajectory {
  // Check input data
  if (position === undefined || typeof position !== 'number') {
    throw new Error('Invalid data format. Position must be a number from 0.0 (closed) to 0.03 (open)');
  }

  // Create message for gripper control
  return {
    header: {
      stamp: {
        sec: 0,
        nanosec: 0
      },
      frame_id: ''
    },
    joint_names: ['left_finger', 'right_finger'],
    points: [
      {
        positions: [position, -position], // Right finger moves in opposite direction
        velocities: [],
        accelerations: [],
        effort: [],
        time_from_start: {
          sec: Math.floor(timeFromStart),
          nanosec: Math.floor((timeFromStart % 1) * 1e9)
        }
      }
    ]
  };
}

export function sendArmCommand(publisher: rclnodejs.Publisher<any>, positions: number[], timeFromStart: number = 1): void {
  const message = createArmTrajectoryMessage(positions, timeFromStart);
  publisher.publish(message);
}

export function sendGripperCommand(publisher: rclnodejs.Publisher<any>, position: number, timeFromStart: number = 1): void {
  const message = createGripperTrajectoryMessage(position, timeFromStart);
  publisher.publish(message);
}

export async function executeSequence(
  armPublisher: rclnodejs.Publisher<any>,
  gripperPublisher: rclnodejs.Publisher<any>,
  sequence: SequenceCommand[]
): Promise<void> {
  for (const command of sequence) {
    try {
      // Check command type
      if (command.type === 'arm' && command.positions) {
        const message = createArmTrajectoryMessage(
          command.positions,
          command.time_from_start || 1
        );
        armPublisher.publish(message);
      } else if (command.type === 'gripper' && command.position !== undefined) {
        const message = createGripperTrajectoryMessage(
          command.position,
          command.time_from_start || 1
        );
        gripperPublisher.publish(message);
      }

      // Wait for specified time before executing next command
      await new Promise<void>(resolve => setTimeout(resolve, (command.delay || 1) * 1000));
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  console.log('Motion sequence completed');
}