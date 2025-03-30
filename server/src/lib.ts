import * as rclnodejs from 'rclnodejs';
import {ArmCommand} from "./types";

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
        stamp:  {
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

export async function executeSequence(
  armPublisher: rclnodejs.Publisher<any>,
  gripperPublisher: rclnodejs.Publisher<any>,
  sequence: ArmCommand[]
): Promise<void> {
  for (const command of sequence) {
    try {
      if (command.type === 'arm' && command.positions) {
        sendCommand({publisher: armPublisher, command});
      } else if (command.type === 'gripper' && command.positions) {
        sendCommand({publisher: gripperPublisher, command});
      }

      await new Promise<void>(resolve => setTimeout(resolve, (command.delay || 5) * 1000));
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  console.log('Motion sequence completed');
}