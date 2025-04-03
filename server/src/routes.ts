import {Router, Request, Response} from 'express';
import {Publisher} from 'rclnodejs';
import {ArmCommand} from './types';
import {
  sendCommand,
  executeSequence as execSequence
} from './lib';

const router = Router();

let currentJointPositions= {};

export function updateJointPositions(names: string[], positions: number[]): void {
  names.forEach((name, index) => {
    currentJointPositions[name] = positions[index];
  })
}

export function initRoutes(armPub: Publisher<any>, gripperPub: Publisher<any>) {
  const armPublisher = armPub;
  const gripperPublisher = gripperPub;

  router.get('/status', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      message: 'RX200 control server is running and ready',
      jointPositions: currentJointPositions
    });
  });

  router.post('/command', (req: Request, res: Response) => {
    try {
      const command = req.body as ArmCommand;

      if (!command.positions || !Array.isArray(command.positions)) {
        return res.status(400).json({
          error: 'Invalid data format'
        });
      }

      sendCommand({publisher: command.type === 'arm' ? armPublisher : gripperPublisher, command});

      res.json({
        success: true,
        message: 'Command sent to robot arm',
        data: command
      });
    } catch (error) {
      console.error('Error sending command to arm:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/sequence', (req: Request, res: Response) => {
    const {sequence} = req.body as { sequence: ArmCommand[] };

    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({
        error: 'Invalid data format. Sequence must be an array of commands'
      });
    }

    res.json({
      success: true,
      message: 'Starting movement sequence execution',
      data: {
        sequenceLength: sequence.length
      }
    });

    execSequence(armPublisher, gripperPublisher, sequence)
      .catch(err => console.error('Error executing sequence:', err));
  });

  return router;
}
