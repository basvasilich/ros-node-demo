import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import rclnodejs from 'rclnodejs';
import {Node, Publisher} from 'rclnodejs';
import {initRoutes} from './routes';

// Setup Express server
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './public')));

// Global variables for ROS publishers
let armPublisher: Publisher<any>;
let gripperPublisher: Publisher<any>;
let rosNode: Node;

// Initialize ROS2 node
async function initializeROS(): Promise<void> {
  try {
    // Initialize rclnodejs
    await rclnodejs.init()

    // Create node
    rosNode = new rclnodejs.Node('rx200_controller_node');

    // Create publishers for robot control topics
    armPublisher = rosNode.createPublisher(
      'trajectory_msgs/msg/JointTrajectory',
      '/rx200/arm_controller/joint_trajectory'
    );

    gripperPublisher = rosNode.createPublisher(
      'trajectory_msgs/msg/JointTrajectory',
      '/rx200/gripper_controller/joint_trajectory'
    );

    // Start node cycle
    rosNode.spin();

    console.log('ROS2 node initialized');
  } catch (error) {
    console.error('Error initializing ROS2:', error);
    throw error;
  }
}

// Server startup function
async function startServer(): Promise<void> {
  try {
    // Initialize ROS
    await initializeROS();

    // Initialize and add routes to the app
    const routes = initRoutes(armPublisher, gripperPublisher);
    app.use('/', routes);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start server
startServer();