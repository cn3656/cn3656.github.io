/**
 * Atom Blog - 部署模块
 * 支持: GitHub Pages, Gitee Pages, Cloudflare Pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 部署入口
 */
async function deploy(baseDir, type) {
  // 读取配置
  const configPath = path.join(baseDir, '_config.yml');
  let deployConfig = {};
  
  if (fs.existsSync(configPath)) {
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    deployConfig = config.deploy || {};
  }
  
  type = type || deployConfig.type || 'git';
  
  console.log(`[Atom] Deploying via ${type}...`);
  
  switch (type) {
    case 'git':
      await deployGit(baseDir, deployConfig);
      break;
    case 'cloudflare':
    case 'cf':
      await deployCloudflare(baseDir, deployConfig);
      break;
    case 'gitee':
      await deployGitee(baseDir, deployConfig);
      break;
    default:
      console.error(`[Atom] Unknown deploy type: ${type}`);
      console.log('[Atom] Supported types: git, gitee, cloudflare');
      process.exit(1);
  }
}

/**
 * 部署到 GitHub Pages
 */
async function deployGit(baseDir, config) {
  const publicDir = path.join(baseDir, 'public');
  const repo = config.repo;
  const branch = config.branch || 'main';
  const message = config.message || `Site updated: ${new Date().toISOString()}`;
  
  if (!repo) {
    console.error('[Atom] No deploy.repo configured in _config.yml');
    console.log('[Atom] Example:');
    console.log('  deploy:');
    console.log('    type: git');
    console.log('    repo: https://github.com/user/user.github.io.git');
    console.log('    branch: main');
    process.exit(1);
  }
  
  if (!fs.existsSync(publicDir)) {
    console.error('[Atom] No public directory. Run `atom generate` first.');
    process.exit(1);
  }
  
  // 使用 .deploy_git 临时目录
  const deployDir = path.join(baseDir, '.deploy_git');
  
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true });
  }
  
  const exec = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
  
  try {
    // Clone
    exec(`git clone --depth 1 --branch ${branch} ${repo} .deploy_git`, baseDir);
    
    // 清空旧文件 (保留 .git)
    const entries = fs.readdirSync(deployDir);
    for (const entry of entries) {
      if (entry === '.git') continue;
      const fullPath = path.join(deployDir, entry);
      fs.rmSync(fullPath, { recursive: true });
    }
    
    // 复制新文件
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir(publicDir, deployDir);
    
    // 添加 CNAME (如果有)
    const cnamePath = path.join(baseDir, 'source/CNAME');
    if (fs.existsSync(cnamePath)) {
      fs.copyFileSync(cnamePath, path.join(deployDir, 'CNAME'));
    }
    
    // 提交推送
    exec('git add -A', deployDir);
    exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, deployDir);
    exec('git push origin ' + branch, deployDir);
    
    console.log('[Atom] Deployed to GitHub Pages successfully!');
  } catch (e) {
    // 如果 clone 失败 (空仓库), 初始化新仓库
    if (e.message.includes('not found') || e.message.includes('empty')) {
      console.log('[Atom] Initializing new deployment...');
      fs.mkdirSync(deployDir, { recursive: true });
      
      const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
          const srcPath = path.join(src, entry);
          const destPath = path.join(dest, entry);
          if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyDir(publicDir, deployDir);
      
      exec('git init', deployDir);
      exec('git add -A', deployDir);
      exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, deployDir);
      exec(`git remote add origin ${repo}`, deployDir);
      exec(`git branch -M ${branch}`, deployDir);
      exec('git push -u origin ' + branch, deployDir);
      
      console.log('[Atom] Deployed to GitHub Pages successfully!');
    } else {
      console.error('[Atom] Deploy failed:', e.message);
      throw e;
    }
  }
}

/**
 * 部署到 Gitee Pages
 * (与 GitHub 类似的流程)
 */
async function deployGitee(baseDir, config) {
  const giteeConfig = {
    ...config,
    repo: config.gitee_repo || config.repo
  };
  
  if (!giteeConfig.repo) {
    console.error('[Atom] No deploy.repo configured for Gitee');
    console.log('[Atom] Example:');
    console.log('  deploy:');
    console.log('    type: gitee');
    console.log('    gitee_repo: https://gitee.com/user/user.git');
    console.log('    branch: master');
    process.exit(1);
  }
  
  await deployGit(baseDir, giteeConfig);
  console.log('[Atom] Note: Gitee Pages may need manual activation in repository settings.');
}

/**
 * 部署到 Cloudflare Pages
 */
async function deployCloudflare(baseDir, config) {
  const publicDir = path.join(baseDir, 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.error('[Atom] No public directory. Run `atom generate` first.');
    process.exit(1);
  }
  
  const exec = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
  
  // 方法1: 使用 Wrangler CLI
  try {
    exec('which wrangler', baseDir);
    
    console.log('[Atom] Using Wrangler to deploy...');
    
    // 生成 wrangler.toml 如果不存在
    const wranglerPath = path.join(baseDir, 'wrangler.toml');
    if (!fs.existsSync(wranglerPath)) {
      const projectName = config.cf_project || path.basename(baseDir).replace('.github.io', '');
      const wranglerConfig = `name = "${projectName}"
compatibility_date = "2024-01-01"

[site]
bucket = "./public"
`;
      fs.writeFileSync(wranglerPath, wranglerConfig, 'utf8');
      console.log('[Atom] Created wrangler.toml');
    }
    
    exec('npx wrangler pages deploy public --project-name=' + (config.cf_project || 'atom-blog'), baseDir);
    console.log('[Atom] Deployed to Cloudflare Pages!');
    
  } catch (e) {
    // Wrangler 不可用, 使用 git 部署
    console.log('[Atom] Wrangler not found. Using Git-based deployment...');
    console.log('[Atom] To deploy to Cloudflare Pages:');
    console.log('');
    console.log('  1. Go to https://dash.cloudflare.com/');
    console.log('  2. Create a new Pages project');
    console.log('  3. Connect your GitHub/Gitee repository');
    console.log('  4. Set build command: npm run generate');
    console.log('  5. Set output directory: public');
    console.log('');
    console.log('  Or install Wrangler:');
    console.log('  npm install -g wrangler && wrangler login');
    console.log('');
    
    // 也可以直接推 git
    if (config.repo) {
      console.log('[Atom] Pushing to git for Cloudflare Pages auto-deploy...');
      await deployGit(baseDir, config);
    }
  }
}

module.exports = { deploy };
