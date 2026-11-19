# Skylight — 10-day weather app

A responsive city weather app built with React and Vite. Search for cities around the world, use your device location, and view current conditions plus a 10-day forecast. Celsius and Fahrenheit are supported.

## Run locally

1. Install Node.js (18+).
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

## Deploy with GitHub and Vercel

1. Create a GitHub repository and upload these project files (or push this folder with Git).
2. In Vercel, choose **Add New → Project** and import the GitHub repository.
3. Keep the detected Vite settings: build command `npm run build`, output directory `dist`.
4. Select **Deploy**. No environment variables or API key are required.

Vercel creates preview deployments for pull requests and deploys updates when you push to the connected branch.

## Weather source

Forecasts and geocoding use the Open-Meteo public APIs. Browser location requires the visitor to grant permission and works on HTTPS (Vercel provides HTTPS) or localhost.
