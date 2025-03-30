import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import rclnodejs from 'rclnodejs';
import {Node, Publisher} from 'rclnodejs';
import {initRoutes, updateJointPositions} from './routes';

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../../client/public')));

let armPublisher: Publisher<any>;
let gripperPublisher: Publisher<any>;
let rosNode: Node;

async function initializeROS(): Promise<void> {
  try {
    await rclnodejs.init()

    rosNode = new rclnodejs.Node('rx200_controller_node');

    armPublisher = rosNode.createPublisher(
      'trajectory_msgs/msg/JointTrajectory',
      '/rx200/arm_controller/joint_trajectory'
    );

    gripperPublisher = rosNode.createPublisher(
      'trajectory_msgs/msg/JointTrajectory',
      '/rx200/gripper_controller/joint_trajectory'
    );

    rosNode.createSubscription(
      'sensor_msgs/msg/JointState',
      '/rx200/joint_states',
      (message: any) => {
        updateJointPositions(message.name, message.position);
      }
    );

    rosNode.spin();

    console.log('ROS2 node initialized');
    console.log('Subscribed to /rx200/joint_states');
  } catch (error) {
    console.error('Error initializing ROS2:', error);
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    await initializeROS();

    const routes = initRoutes(armPublisher, gripperPublisher);
    app.use('/', routes);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();