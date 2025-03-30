import * as rclnodejs from 'rclnodejs';
import {ArmCommand} from "./types";

const DEFAULT_DELAY = 2;

export function sendCommand({publisher, command}: {
  publisher: rclnodejs.Publisher<any>; command: ArmCommand
}): void {

  let joint_names = []

  if (command.type === 'arm') {
    joint_names = ['waist', 'shoulder', 'elbow', 'wrist_angle', 'wrist_rotate']
  } else if (command.type === 'gripper') {
    joint_names = ['left_finger', 'right_finger']
  }

  publisher.publish({
      header: {
        stamp: {
          sec: 0,
          nanosec: 0
        },
        frame_id: ''
      },
      joint_names,
      points: [
        {
          positions: command.positions,
          velocities: [],
          accelerations: [],
          effort: [],
          time_from_start: {
            sec: Math.floor(command.timeFromStart),
            nanosec: Math.floor((command.timeFromStart - Math.floor(command.timeFromStart)) * 1000000000)
          }
        }
      ]
    }
  );
}

export function sendBatchCommands(
  publisher: rclnodejs.Publisher<any>,
  commands: ArmCommand[],
  type: 'arm' | 'gripper'
): void {
  const joint_names = type === 'arm'
    ? ['waist', 'shoulder', 'elbow', 'wrist_angle', 'wrist_rotate']
    : ['left_finger', 'right_finger'];

  const points = [];
  let cumulativeTime = 0;

  for (const command of commands) {
    cumulativeTime += (command.delay || DEFAULT_DELAY);

    points.push({
      positions: command.positions,
      velocities: [],
      accelerations: [],
      effort: [],
      time_from_start: {
        sec: command.timeFromStart ? Math.floor(command.timeFromStart) : Math.floor(cumulativeTime),
        nanosec: command.timeFromStart ? 0 : Math.floor((cumulativeTime - Math.floor(cumulativeTime)) * 1000000000)
      }
    });
  }

  publisher.publish({
    header: {
      stamp: {
        sec: 0,
        nanosec: 0
      },
      frame_id: ''
    },
    joint_names,
    points
  });
}

function calculateTotalExecutionTime(sequence: ArmCommand[]): number {
  let totalTime = 0;

  for (const command of sequence) {
    totalTime += (command.delay || DEFAULT_DELAY);
  }

  return totalTime;
}

export async function executeSequence(
  armPublisher: rclnodejs.Publisher<any>,
  gripperPublisher: rclnodejs.Publisher<any>,
  sequence: ArmCommand[]
): Promise<void> {
  const armCommands: ArmCommand[] = [];
  const gripperCommands: ArmCommand[] = [];

  sequence.forEach(command => {
    if (command.type === 'arm' && command.positions) {
      armCommands.push(command);
    } else if (command.type === 'gripper' && command.positions) {
      gripperCommands.push(command);
    }
  });

  try {
    if (armCommands.length > 0) {
      sendBatchCommands(armPublisher, armCommands, 'arm');
    }

    if (gripperCommands.length > 0) {
      sendBatchCommands(gripperPublisher, gripperCommands, 'gripper');
    }

    const totalTime = calculateTotalExecutionTime(sequence);

    await new Promise<void>(resolve => setTimeout(resolve, totalTime * 1000));

    console.log('Motion sequence completed');
  } catch (error) {
    console.error('Error executing sequence:', error);
    throw error;
  }
}

