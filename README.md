<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18vjBoWyFdEjOdLwvorRyb4xRRhR23A6x

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Server

**Prerequisites:** Go 1.21+, Node.js 16+, npm 8+

### Quick Start

1. Make sure ports 5173 (frontend) and 9000 (backend) are open in your server's security group
2. Start the application:
   `./start.sh`
3. Stop the application:
   `./stop.sh`

### Manual Deployment

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for detailed deployment instructions.