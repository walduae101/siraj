#!/usr/bin/env node

/**
 * Enterprise Next.js App Template Generator
 * 
 * This script generates a new app from the template by replacing placeholders
 * with user-provided values.
 * 
 * Usage:
 *   node scripts/generate-template.js <app-name> [options]
 * 
 * Options:
 *   --description "App description"
 *   --author "Author name"
 *   --domain "example.com"
 *   --firebase-project "project-id"
 *   --output-dir "./output"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =============================================================================
// CONFIGURATION
// =============================================================================

const TEMPLATE_FILES = [
  'TEMPLATE_README.md',
  'TEMPLATE_package.json',
  'TEMPLATE_env.example',
  'TEMPLATE_next.config.mjs',
  'TEMPLATE_firebase.json',
  'TEMPLATE_cloudbuild.yaml',
  'TEMPLATE_src_app_layout.tsx',
  'TEMPLATE_src_env.js'
];

const TEMPLATE_DIRS = [
  'src/app',
  'src/components',
  'src/lib',
  'src/server',
  'src/stores',
  'src/styles',
  'src/trpc',
  'src/types',
  'monitoring',
  'scripts',
  'docs'
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function prompt(question, defaultValue = '') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${question}${defaultValue ? ` (${defaultValue})` : ''}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

function validateInput(input, fieldName) {
  if (!input || input.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  
  // Validate app name (no spaces, special chars)
  if (fieldName === 'appName') {
    if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
      throw new Error('App name can only contain letters, numbers, hyphens, and underscores');
    }
  }
  
  // Validate domain
  if (fieldName === 'domain') {
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input)) {
      throw new Error('Please enter a valid domain (e.g., example.com)');
    }
  }
  
  return input.trim();
}

function replacePlaceholders(content, replacements) {
  let result = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateAppName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-');
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

async function generateTemplate() {
  try {
    log('🚀 Enterprise Next.js App Template Generator', 'success');
    log('===============================================', 'info');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const appName = args[0];
    
    if (!appName) {
      log('❌ App name is required', 'error');
      log('Usage: node scripts/generate-template.js <app-name> [options]', 'info');
      process.exit(1);
    }
    
    // Validate app name
    const validatedAppName = validateInput(appName, 'appName');
    const kebabAppName = generateAppName(validatedAppName);
    const pascalAppName = validatedAppName
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    
    log(`\n📝 Generating app: ${pascalAppName}`, 'info');
    
    // Collect user input
    const description = await prompt('App description', 'A modern Next.js application');
    const author = await prompt('Author name', 'Your Name');
    const company = await prompt('Company name', 'Your Company');
    const domain = await prompt('Domain', `${kebabAppName}.com`);
    const firebaseProject = await prompt('Firebase project ID', `${kebabAppName}-project`);
    const outputDir = await prompt('Output directory', `./${kebabAppName}`);
    
    // Validate inputs
    validateInput(description, 'description');
    validateInput(author, 'author');
    validateInput(company, 'company');
    validateInput(domain, 'domain');
    validateInput(firebaseProject, 'firebaseProject');
    
    // Create replacements object
    const replacements = {
      APP_NAME: pascalAppName,
      APP_DESCRIPTION: description,
      AUTHOR_NAME: author,
      COMPANY_NAME: company,
      WEBSITE_URL: `https://${domain}`,
      APP_URL: `https://${domain}`,
      DOMAIN: domain,
      FIREBASE_PROJECT_ID: firebaseProject,
      SERVICE_NAME: kebabAppName,
      CDN_MAP_NAME: `${kebabAppName}-web-map`,
      LANGUAGE: 'en',
      TEXT_DIRECTION: 'ltr',
      LOCALE: 'en_US',
      THEME_COLOR: '#000000',
      APP_CATEGORY: 'Productivity',
      TWITTER_HANDLE: 'yourhandle',
      OG_IMAGE_URL: `https://${domain}/og-image.png`,
      APP_KEYWORDS: 'nextjs,react,typescript,firebase',
      FIREBASE_API_KEY: 'your-firebase-api-key',
      FIREBASE_AUTH_DOMAIN: `${firebaseProject}.firebaseapp.com`,
      FIREBASE_APP_ID: 'your-firebase-app-id',
      FIREBASE_MESSAGING_SENDER_ID: 'your-sender-id',
      FIREBASE_STORAGE_BUCKET: `${firebaseProject}.appspot.com`,
      STRIPE_PUBLISHABLE_KEY: 'your-stripe-key',
      PAYNOW_STORE_ID: 'your-paynow-store-id',
      AI_PROVIDER: 'openai',
      GA_MEASUREMENT_ID: 'your-ga-id'
    };
    
    log('\n🔧 Generating template files...', 'info');
    
    // Create output directory
    if (fs.existsSync(outputDir)) {
      const overwrite = await prompt(`Directory ${outputDir} already exists. Overwrite? (y/N)`, 'N');
      if (overwrite.toLowerCase() !== 'y') {
        log('❌ Generation cancelled', 'error');
        process.exit(0);
      }
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Copy template files and replace placeholders
    for (const templateFile of TEMPLATE_FILES) {
      if (fs.existsSync(templateFile)) {
        const content = fs.readFileSync(templateFile, 'utf8');
        const processedContent = replacePlaceholders(content, replacements);
        
        const outputFile = templateFile.replace('TEMPLATE_', '');
        const outputPath = path.join(outputDir, outputFile);
        
        // Ensure directory exists
        const outputDirPath = path.dirname(outputPath);
        if (!fs.existsSync(outputDirPath)) {
          fs.mkdirSync(outputDirPath, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, processedContent);
        log(`✅ Generated ${outputFile}`, 'success');
      }
    }
    
    // Copy source directories
    for (const templateDir of TEMPLATE_DIRS) {
      if (fs.existsSync(templateDir)) {
        const outputPath = path.join(outputDir, templateDir);
        copyDirectory(templateDir, outputPath);
        log(`✅ Copied ${templateDir}/`, 'success');
      }
    }
    
    // Copy other important files
    const importantFiles = [
      'tsconfig.json',
      'tailwind.config.js',
      'postcss.config.js',
      'biome.jsonc',
      'Dockerfile',
      '.gitignore',
      'README.md'
    ];
    
    for (const file of importantFiles) {
      if (fs.existsSync(file)) {
        const outputPath = path.join(outputDir, file);
        fs.copyFileSync(file, outputPath);
        log(`✅ Copied ${file}`, 'success');
      }
    }
    
    // Generate package.json with proper name
    const packageJsonPath = path.join(outputDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = kebabAppName;
      packageJson.description = description;
      packageJson.author = author;
      packageJson.repository.url = `https://github.com/${author}/${kebabAppName}`;
      packageJson.bugs.url = `https://github.com/${author}/${kebabAppName}/issues`;
      packageJson.homepage = `https://${domain}`;
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('✅ Updated package.json', 'success');
    }
    
    // Generate .env.local
    const envPath = path.join(outputDir, '.env.local');
    const envContent = `# Generated by template generator
NEXT_PUBLIC_APP_NAME="${pascalAppName}"
NEXT_PUBLIC_APP_DESCRIPTION="${description}"
NEXT_PUBLIC_WEBSITE_URL="https://${domain}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${firebaseProject}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${firebaseProject}.firebaseapp.com"

# TODO: Fill in your actual values
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${firebaseProject}.appspot.com"
`;
    
    fs.writeFileSync(envPath, envContent);
    log('✅ Generated .env.local', 'success');
    
    // Generate setup instructions
    const setupPath = path.join(outputDir, 'SETUP.md');
    const setupContent = `# Setup Instructions for ${pascalAppName}

## 1. Install Dependencies

\`\`\`bash
cd ${outputDir}
pnpm install
\`\`\`

## 2. Configure Environment

\`\`\`bash
# Copy environment file
cp .env.local .env.local.backup

# Edit with your values
nano .env.local
\`\`\`

## 3. Firebase Setup

\`\`\`bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select: Firestore, Hosting, Functions
# Use project ID: ${firebaseProject}
\`\`\`

## 4. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

## 5. Build and Deploy

\`\`\`bash
# Build
pnpm build

# Deploy to Firebase
pnpm deploy:dev

# Or use Cloud Build
pnpm deploy:cloud
\`\`\`

## Next Steps

1. Customize the app branding and colors
2. Set up your database schema
3. Configure authentication providers
4. Set up monitoring and analytics
5. Deploy to production

For detailed documentation, see the main README.md file.
`;
    
    fs.writeFileSync(setupPath, setupContent);
    log('✅ Generated SETUP.md', 'success');
    
    // Success message
    log('\n🎉 Template generation completed successfully!', 'success');
    log('===============================================', 'info');
    log(`📁 Output directory: ${outputDir}`, 'info');
    log(`🚀 App name: ${pascalAppName}`, 'info');
    log(`🌐 Domain: ${domain}`, 'info');
    log(`🔥 Firebase project: ${firebaseProject}`, 'info');
    
    log('\n📋 Next steps:', 'info');
    log('1. cd ' + outputDir, 'info');
    log('2. pnpm install', 'info');
    log('3. Configure your environment variables', 'info');
    log('4. Set up Firebase project', 'info');
    log('5. pnpm dev', 'info');
    
    log('\n📚 See SETUP.md for detailed instructions', 'info');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// =============================================================================
// RUN GENERATOR
// =============================================================================

if (require.main === module) {
  generateTemplate();
}

module.exports = { generateTemplate };
