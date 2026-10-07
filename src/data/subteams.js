export const SUBTEAMS = [
  {
    title: 'Mechanical',
    description:
      'Mechanical members at CUPI design the structures that enable sensing, motion, and autonomy. From drone frames to walking robots, MechEs turn requirements from CS and ECE into lightweight, robust, and modular hardware.',
    label: 'Current Mechanical projects include:',
    items: [
      'Scout Quadcopter Structure: Continuing drone bring-up, designing modular mounts for LiDAR and cameras, and optimizing prop guards and weight',
      'Hexapod Mechanical Design: Designing a protective exoskeleton, 3-DOF leg geometry, and the main body for a walking robot',
      'Modovolo Sensor Housing: Fabricating a modular perception payload to integrate LiDAR and sensors onto Modovolo\'s drone platform',
      'Autonomy Test Platforms: Designing mounts and fixtures for sensors used in autonomy testing on ground vehicles (hexapod), and airborne drones (modovolo)'
    ]
  },
  {
    title: 'Electrical',
    description:
      'ECE members at CUPI design the electronics and embedded systems that power our robots, from custom PCBs to firmware and communication stacks. Each project is tightly coupled to a physical platform, with boards designed, assembled, and tested by the team.',
    label: 'Current ECE projects include:',
    items: [
      'Scout Quadcopter Electronics: Designing sensor boards, ESP-32 communication, and power distribution for a downward-facing camera and LiDAR testing',
      'Hexapod Sensor & Power Stack: Building a custom sensor board, improving the PDB, integrating servo drivers, and enabling ESP-NOW communication with the quadcopter',
      'Modovolo Perception Hub: Testing sensor boards and PDBs, integrating LiDAR, Jetson Nano Orin, and low-level STM32 firmware'
    ]
  },
  {
    title: 'Software',
    description:
      'CS members at CUPI build the autonomy and perception software that runs on our robots in the real world. Our work spans aerial and ground platforms, with projects tied directly to physical hardware and live sensor data, not just simulation.',
    label: 'Current CS projects include:',
    items: [
      'Anduril AI Grand Prix: Building perception and navigation software for autonomous vehicles, focusing on real-time decision-making and sensor processing',
      'Modovolo Perception Stack: Developing a ROS 2-based perception stack using 3D LiDAR and cameras on Jetson Nano / Orin for autonomous flight and safety',
      'Hexapod Autonomy: Implementing control loops, mapping, and navigation logic for a walking robot with onboard perception',
      'Scout Quadcopter: Processing downward-facing camera data and coordinating with the hexapod to map environments collaboratively'
    ]
  },
  {
    title: 'Business & Marketing',
    description:
      'Business & Marketing members manage finances, recruitment, and outreach to connect CUPI with sponsors, new members, and the broader Cornell community.',
    label: 'Current Business & Marketing efforts include:',
    items: [
      'Sponsorship Outreach: Securing funding and partnerships with industry sponsors to support hardware purchases, competition entry fees, and team operations'
    ]
  }
];
