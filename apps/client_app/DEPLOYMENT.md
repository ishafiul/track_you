# Deployment Guide for Git-Based CMS

This document provides step-by-step instructions for deploying the Git-Based CMS to Cloudflare Pages.

## Prerequisites

Before deploying, make sure you have:

1. A GitHub account with a repository for your content
2. A GitHub Personal Access Token with repo permissions
3. A Cloudflare account

## Local Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.dev.vars` file with your GitHub credentials:
   ```
   GITHUB_TOKEN=your_github_token_here
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=your_repository_name
   GITHUB_BRANCH=main
   ```

4. Start the development server:
   ```
   npm run dev
   ```
   
   For local development with environment variables:
   ```
   npm run dev:cf
   ```

## Cloudflare Pages Deployment

### Option 1: Manual Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Install Wrangler if you haven't already:
   ```
   npm install -g wrangler
   ```

3. Log in to your Cloudflare account:
   ```
   wrangler login
   ```

4. Set up environment variables in Cloudflare:
   ```
   wrangler secret put GITHUB_TOKEN
   wrangler secret put GITHUB_OWNER
   wrangler secret put GITHUB_REPO
   wrangler secret put GITHUB_BRANCH
   ```

5. Deploy the application:
   ```
   npm run deploy
   ```

### Option 2: GitHub Integration with Cloudflare Pages

1. Push your code to GitHub
2. Log in to the Cloudflare dashboard
3. Go to Pages > Create a project
4. Connect your GitHub repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Add environment variables:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `GITHUB_OWNER`: Your GitHub username
   - `GITHUB_REPO`: Your repository name
   - `GITHUB_BRANCH`: Your branch name (default: main)
7. Deploy the site

## Continuous Deployment

To set up continuous deployment:

1. Make sure your Cloudflare Pages project is connected to your GitHub repository
2. Cloudflare will automatically build and deploy your site when changes are pushed to the main branch
3. You can also set up preview deployments for pull requests

## Troubleshooting

- **Missing Environment Variables**: Make sure all required environment variables are set in Cloudflare
- **API Errors**: Check your GitHub token has the correct permissions
- **Build Errors**: Review the build logs in Cloudflare Pages dashboard

## Security Considerations

- Never commit your `.dev.vars` file to version control
- Use Cloudflare's environment variables for storing sensitive information
- Consider implementing authentication for your CMS interface in production 