# PairXpenses - Plain JavaScript

A simple expense tracking application for two users, built with vanilla JavaScript.

## Features

- User authentication with JWT tokens
- Track payments and debts for two users
- Customizable expense split percentage
- Generate monthly expense reports
- Reset all data for new month

## Setup

1. The app connects to the API at: `https://pairxpensesapi.azurewebsites.net/api`
2. Open `index.html` in a web browser or deploy to a static hosting service

## Deployment to Azure App Service

### Option 1: Using GitHub Actions (Recommended)

1. Create a new Azure App Service (Static Web App or App Service with Windows/Linux)

2. Push this code to a GitHub repository

3. In your GitHub repository settings, add the following secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` - Download from Azure Portal

4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'pairxpensesapp'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

### Option 2: Using Azure CLI

```bash
# Login to Azure
az login

# Deploy to existing App Service
az webapp up --name pairxpensesapp --resource-group your-resource-group --html
```

### Option 3: Using FTP

1. Go to Azure Portal > Your App Service > Deployment Center
2. Get FTP credentials
3. Upload all files to `/site/wwwroot/`

### Option 4: Replace Existing Blazor App

If you want to use the same App Service URL as your Blazor app:

1. Stop the current app in Azure Portal
2. Go to Deployment Center
3. Disconnect current deployment source
4. Deploy this JavaScript app using any method above
5. Make sure `index.html` is in the root directory

## web.config for Azure (if needed)

If deploying to Windows App Service, create this `web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
```

## Local Development

Simply open `index.html` in a web browser. For better development experience, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## API Configuration

The API base URL is configured in `js/api.js`. Change it if needed:

```javascript
const API_BASE_URL = 'https://pairxpensesapi.azurewebsites.net/api';
```

## Browser Support

Works in all modern browsers that support:
- ES6 Modules
- Fetch API
- LocalStorage
- Arrow functions
