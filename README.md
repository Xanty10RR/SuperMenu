# SuperMenu (Sistema ERP)

A cross-platform desktop application built with Electron and React.

## Overview

`SuperMenu` is a desktop application (custom ERP system) created using the Electron framework, with a user interface built on React, designed to centralize requests, deliveries, support, users, and requisitions within a single desktop application — enhancing efficiency, operational control, and business process tracking. It is configured to be packaged for Windows, macOS, and Linux using `electron-builder`.

## Features

- Cross-platform compatibility (Windows, macOS, Linux).
- Modern and reactive UI built with React.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and a package manager like `npm` or `pnpm` installed on your system.

- Node.js
- pnpm (Recommended, as a `pnpm-lock.yaml` is present in the project configuration)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd SuperMenu
    ```

2.  **Install dependencies:**
    Use `pnpm` to install the project's dependencies.
    ```sh
    pnpm install
    ```

## Development

To run the application in development mode with hot-reloading, execute the following command:

```sh
pnpm dev
```

This will start the Electron application and open a development window with developer tools enabled.

## Building for Production

To build and package the application for your current platform, run:

```sh
pnpm build
```

This command will generate the distributable files (e.g., an `.exe` installer for Windows, `.dmg` for macOS) in the `release` or `dist` directory.

## Core Technologies

- **Electron**: A framework for creating native applications with web technologies like JavaScript, HTML, and CSS.
- **React**: A JavaScript library for building user interfaces.
- **electron-builder**: A complete solution to package and build a ready-for-distribution Electron app.
- **Electron Vite**: (Inferred from configuration) A fast and opinionated build tool for modern Electron applications.

## Contact me

- 👨🏻‍💻[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/daniel-santiago-rosero-4420a91b0/)
- 📧 [![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:santiagocajamarca.37@gmail.com)
