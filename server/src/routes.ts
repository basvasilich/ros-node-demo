import { Router, Request, Response } from 'express';
import { Publisher } from 'rclnodejs';
import { ArmCommand, GripperCommand, SequenceCommand } from './types';
import {
  sendArmCommand,
  sendGripperCommand,
  executeSequence as execSequence
} from './lib';

// Create router
const router = Router();

/**
 * Initialize routes with required publishers
 * @param armPub Publisher for arm control
 * @param gripperPub Publisher for gripper control
 * @returns Configured Express router
 */
export function initRoutes(armPub: Publisher<any>, gripperPub: Publisher<any>) {
  // Store publishers in closure
  const armPublisher = armPub;
  const gripperPublisher = gripperPub;

  // Route to get current robot status information
  router.get('/status', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      message: 'RX200 control server is running and ready'
    });
  });

  // Route for robot arm control
  router.post('/arm', (req: Request, res: Response) => {
    try {
      const { positions, time_from_start = 1 } = req.body as ArmCommand;

      // Check data
      if (!positions || !Array.isArray(positions) || positions.length !== 5) {
        return res.status(400).json({
          error: 'Invalid data format. Positions must be an array of 5 values [waist, shoulder, elbow, wrist_angle, wrist_rotate]'
        });
      }

      // Using the function from lib.ts to send command
      sendArmCommand(armPublisher, positions, time_from_start);

      res.json({
        success: true,
        message: 'Command sent to robot arm',
        data: {
          positions,
          time_from_start
        }
      });
    } catch (error) {
      console.error('Error sending command to arm:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for robot gripper control
  router.post('/gripper', (req: Request, res: Response) => {
    try {
      const { position, time_from_start = 1 } = req.body as GripperCommand;

      // Check data
      if (position === undefined || typeof position !== 'number') {
        return res.status(400).json({
          error: 'Invalid data format. Position must be a number from 0.0 (closed) to 0.03 (open)'
        });
      }

      // Using the function from lib.ts to send command
      sendGripperCommand(gripperPublisher, position, time_from_start);

      res.json({
        success: true,
        message: 'Command sent to robot gripper',
        data: {
          position,
          time_from_start
        }
      });
    } catch (error) {
      console.error('Error sending command to gripper:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Route for executing predefined movement sequences
  router.post('/sequence', (req: Request, res: Response) => {
    const { sequence } = req.body as { sequence: SequenceCommand[] };

    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({
        error: 'Invalid data format. Sequence must be an array of commands'
      });
    }

    // Send confirmation of sequence execution start
    res.json({
      success: true,
      message: 'Starting movement sequence execution',
      data: {
        sequenceLength: sequence.length
      }
    });

    // Execute sequence in background
    execSequence(armPublisher, gripperPublisher, sequence)
      .catch(err => console.error('Error executing sequence:', err));
  });

  // Route for executing demonstration sequence
  router.get('/demo', (req: Request, res: Response) => {
    const demo_sequence: SequenceCommand[] = [
      { type: 'arm', positions: [0, 0, 0, 0, 0], delay: 2 },                // Initial position
      { type: 'gripper', position: 0.03, delay: 2 },                         // Open gripper
      { type: 'arm', positions: [1.0, 0, 0, 0, 0], delay: 2 },               // Rotate base
      { type: 'arm', positions: [1.0, 0.5, 0.5, 0, 0], delay: 2 },           // Tilt shoulder and elbow
      { type: 'arm', positions: [1.0, 0.5, 0.5, 0, 1.0], delay: 2 },         // Rotate gripper
      { type: 'gripper', position: 0, delay: 2 },                            // Close gripper
      { type: 'arm', positions: [0, 0, 0, 0, 0], delay: 2 }                  // Return to initial position
    ];

    res.json({
      success: true,
      message: 'Demo sequence started',
      data: {
        sequenceLength: demo_sequence.length
      }
    });

    // Execute demo in background
    execSequence(armPublisher, gripperPublisher, demo_sequence)
      .catch(err => console.error('Error executing demo:', err));
  });

  return router;
}