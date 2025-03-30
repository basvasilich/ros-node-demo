# RX200 Robot Controller

A web-based controller for the Interbotix RX200 robotic arm using ROS2, Node.js, Express, and TypeScript.

## Overview

This application provides a web interface to control the Interbotix RX200 robotic arm in ROS2 environments. The system consists of:

- **Backend**: Node.js server with Express and rclnodejs to communicate with ROS2
- **Frontend**: HTML/CSS/JavaScript web interface for controlling the robot
- **ROS2 Integration**: Publishes messages to control arm and gripper movements

## Prerequisites

- Ubuntu 22.04 LTS
- ROS2 Humble
- Node.js 22.x
- Interbotix RX200 workspace setup

## Installation Guide

### 1. Install ROS2 Humble on Ubuntu 22.04

```bash
# Setup locale
sudo apt update && sudo apt install locales
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Install ROS2 Humble
sudo apt update && sudo apt install curl -y
curl 'https://raw.githubusercontent.com/Interbotix/interbotix_ros_manipulators/main/interbotix_ros_xsarms/install/amd64/xsarm_amd64_install.sh' > xsarm_amd64_install.sh
chmod +x xsarm_amd64_install.sh
./xsarm_amd64_install.sh -d humble

# Add ROS2 environment setup to .bashrc
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

### 2. Install Node.js 22.x

```bash
# Install Node.js 22.x using NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js 22.x
nvm install 22
nvm use 22
nvm alias default 22

# Verify installation
node --version # Should display v22.x.x
npm --version
```

### 3. Install Interbotix RX200 ROS2 Packages

```bash
# Create a workspace directory
mkdir -p ~/interbotix_ws/src

# Clone the Interbotix repositories
cd ~/interbotix_ws/src
git clone https://github.com/Interbotix/interbotix_ros_manipulators.git -b humble
git clone https://github.com/Interbotix/interbotix_ros_toolboxes.git -b humble

# Install dependencies
cd ~/interbotix_ws
rosdep update
rosdep install --from-paths src --ignore-src -r -y

# Build the workspace
colcon build --symlink-install

# Source the workspace
echo "source ~/interbotix_ws/install/setup.bash" >> ~/.bashrc
source ~/.bashrc

# Install the Interbotix Python Modules
pip3 install interbotix-xs-modules interbotix-common-modules interbotix-perception-modules
```

### 4. Install Robot Controller Application

```bash
# Clone the repository
git clone https://github.com/your-username/rx200-controller.git
cd rx200-controller

# Install dependencies
npm install

# Build TypeScript files
npm run build

# Start the application
npm start
```

## Configuration

Before running the application, you may need to:

1. Update the server IP address in `public/script.js` to match your local network:

```javascript
const config = {
  // Default server URL - modify this to match your server
  serverUrl: 'http://YOUR_LOCAL_IP:3000',
  // Update interval for status checking (ms)
  statusInterval: 5000,
  // Default timeout for requests (ms)
  requestTimeout: 3000
};
```

## Running the Application

### 1. Start the ROS2 Environment for RX200

In one terminal, launch the RX200 robot description and controllers:

```bash
source ~/interbotix_ws/install/setup.bash
ros2 launch interbotix_xsarm_descriptions xsarm_description.launch.py robot_model:=rx200 use_rviz:=true
```

In another terminal, start the hardware interface (if using real robot) or simulation:

```bash
# For simulation
source ~/interbotix_ws/install/setup.bash
ros2 launch interbotix_xsarm_sim xsarm_gz_classic.launch.py robot_model:=rx200

# For real hardware
source ~/interbotix_ws/install/setup.bash
ros2 launch interbotix_xsarm_control xsarm_control.launch.py robot_model:=rx200
```

### 2. Start the Web Controller

```bash
cd rx200-controller
npm start
```

The server will start at http://localhost:3000

## Usage

1. Open your web browser and navigate to http://YOUR_LOCAL_IP:3000
2. The interface provides:
    - Sliders for controlling each arm joint (waist, shoulder, elbow, wrist_angle, wrist_rotate)
    - Gripper control
    - Home position button
    - Demo sequence button
    - Connection status monitoring

## API Endpoints

- `GET /status` - Check server status
- `POST /command` - Control arm positions
- `POST /sequence` - Run a custom sequence of movements

## Troubleshooting

### Common Issues

1. **ROS2 Connection Issues**:
    - Ensure all required ROS2 packages are installed and sourced
    - Check ROS2 topics with `ros2 topic list`

2. **Web Interface Not Connecting**:
    - Verify the correct IP address is set in the script.js file
    - Check server is running with `npm start`

3. **Robot Not Moving**:
    - Verify the robot controllers are running
    - Check for error messages in the server logs

### Debugging

```bash
# Check ROS2 topics
ros2 topic list
ros2 topic echo /rx200/arm_controller/joint_trajectory

# Check node status
ros2 node list
ros2 node info /rx200_controller_node
```

## Project Structure

```
rx200-controller/
├── src/                    # TypeScript source files
│   ├── app.ts              # Main server file
│   ├── lib.ts              # Robot control library
│   ├── routes.ts           # API routes
│   └── types.ts            # TypeScript type definitions
├── public/                 # Frontend files
│   ├── index.html          # Web interface
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # CSS styles
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```
## DOCS

- [Interbotix ROS DOCS](https://docs.trossenrobotics.com/interbotix_xsarms_docs/ros_interface/ros2.html) for the RX200 robot and ROS packages
- [ROS2 Humble](https://docs.ros.org/en/humble/) documentation
- [rclnodejs](https://github.com/RobotWebTools/rclnodejs) for Node.js-ROS2 integration