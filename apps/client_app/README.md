# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

# Git-Based CMS with Cloudflare Pages

This is a simple Git-based content management solution built with Astro and deployed on Cloudflare. It allows you to edit markdown files directly through a web interface, automatically committing changes to GitHub and triggering site rebuilds.

## Features

- ✏️ Edit Markdown content through a clean web interface
- 🔄 Automatic Git commits on content changes
- 🚀 Cloudflare deployment with serverless API endpoints
- 👀 Live preview of content as you edit
- 🔐 GitHub authentication for secure content updates

## How It Works

1. Content is stored as Markdown files in a GitHub repository
2. The web interface allows you to edit these files directly
3. When you save changes, a Cloudflare Function commits the changes to GitHub
4. GitHub webhooks trigger a rebuild of your site (optional)
5. The updated content is deployed automatically

## Setup Instructions

### Prerequisites

- GitHub account with a repository for your content
- GitHub Personal Access Token with repo permissions
- Cloudflare account

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/git-based-cms.git
   cd git-based-cms
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.dev.vars` file with your GitHub credentials (copy from `.dev.vars.example`):
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

5. Visit `http://localhost:4321` in your browser

### Cloudflare Deployment

1. Install Wrangler CLI if you haven't already:
   ```
   npm install -g wrangler
   ```

2. Login to your Cloudflare account:
   ```
   wrangler login
   ```

3. Set up environment variables in Cloudflare:
   ```
   wrangler secret put GITHUB_TOKEN
   wrangler secret put GITHUB_OWNER
   wrangler secret put GITHUB_REPO
   wrangler secret put GITHUB_BRANCH
   ```

4. Build and deploy the application:
   ```
   npm run build
   wrangler publish
   ```

## Customization

- Modify the content structure in `src/content/`
- Customize the editor UI in `src/components/ContentEditor.tsx`
- Enhance the preview renderer in `src/components/ContentPreview.tsx`
- Add more API endpoints in `src/pages/api/`

## License

MIT
