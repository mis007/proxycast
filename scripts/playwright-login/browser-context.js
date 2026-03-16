/**
 * @file browser-context.js
 * @description 浏览器上下文工厂，配置 Playwright 反检测参数
 * @module playwright-login/browser-context
 * 
 * Requirements: 3.2, 3.3
 */

import { chromium } from 'playwright';
import { join } from 'path';
import { homedir, platform } from 'os';
import { existsSync } from 'fs';

/**
 * 默认浏览器配置
 * @type {BrowserConfig}
 */
export const DEFAULT_CONFIG = {
  // 视口大小 - 使用常见的桌面分辨率
  viewport: {
    width: 1920,
    height: 1080
  },
  // 真实的 Chrome 用户代理
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // 反检测启动参数
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials',
    '--disable-web-security',
    '--disable-features=BlockInsecurePrivateNetworkRequests',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-default-apps',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
};

/**
 * 获取系统 Chrome 可执行文件路径
 * @returns {string | null} Chrome 路径，如果未找到则返回 null
 */
export function getSystemChromePath() {
  const os = platform();
  
  if (os === 'darwin') {
    // macOS: 检查常见的 Chrome 安装位置
    const paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      join(homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ];
    for (const p of paths) {
      if (existsSync(p)) return p;
    }
  } else if (os === 'win32') {
    // Windows: 检查常见的 Chrome 安装位置
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
    ];
    for (const p of paths) {
      if (existsSync(p)) return p;
    }
  } else {
    // Linux: 检查常见的 Chrome 安装位置
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ];
    for (const p of paths) {
      if (existsSync(p)) return p;
    }
  }
  
  return null;
}

/**
 * 获取 Playwright Chromium 可执行文件路径
 * @returns {string | null} Playwright Chromium 路径，如果未找到则返回 null
 */
export function getPlaywrightChromiumPath() {
  const home = homedir();
  const os = platform();
  
  // Playwright 浏览器缓存目录
  let cacheDir;
  if (os === 'darwin') {
    cacheDir = join(home, 'Library', 'Caches', 'ms-playwright');
  } else if (os === 'win32') {
    cacheDir = join(home, 'AppData', 'Local', 'ms-playwright');
  } else {
    cacheDir = join(home, '.cache', 'ms-playwright');
  }

  // 查找 chromium 目录
  const chromiumDirs = [
    'chromium-1140', 'chromium-1134', 'chromium-1124', 'chromium-1117',
    'chromium-1112', 'chromium-1108', 'chromium-1105', 'chromium-1097',
    'chromium-1091', 'chromium-1084', 'chromium-1080', 'chromium-1076',
    'chromium-1067', 'chromium-1060', 'chromium-1055', 'chromium-1048',
    'chromium-1045', 'chromium-1041', 'chromium-1033', 'chromium-1028',
    'chromium-1024', 'chromium-1020', 'chromium-1015', 'chromium-1012',
    'chromium-1008', 'chromium-1005', 'chromium-1000', 'chromium'
  ];

  for (const dir of chromiumDirs) {
    let execPath;
    if (os === 'darwin') {
      execPath = join(cacheDir, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    } else if (os === 'win32') {
      execPath = join(cacheDir, dir, 'chrome-win', 'chrome.exe');
    } else {
      execPath = join(cacheDir, dir, 'chrome-linux', 'chrome');
    }

    if (existsSync(execPath)) {
      return execPath;
    }
  }

  return null;
}

/**
 * 获取可用的浏览器路径（优先系统 Chrome）
 * @returns {{ path: string, source: 'system' | 'playwright' } | null}
 */
export function getAvailableBrowserPath() {
  // 优先使用系统 Chrome
  const systemChrome = getSystemChromePath();
  if (systemChrome) {
    return { path: systemChrome, source: 'system' };
  }
  
  // 其次使用 Playwright Chromium
  const playwrightChromium = getPlaywrightChromiumPath();
  if (playwrightChromium) {
    return { path: playwrightChromium, source: 'playwright' };
  }
  
  return null;
}

/**
 * 获取用户数据目录路径
 * @returns {string} 用户数据目录的绝对路径
 */
export function getUserDataDir() {
  return join(homedir(), '.lime', 'playwright-data');
}

/**
 * 创建浏览器配置对象
 * @param {Partial<BrowserConfig>} [overrides] - 覆盖默认配置的选项
 * @returns {BrowserConfig} 完整的浏览器配置
 */
export function createBrowserConfig(overrides = {}) {
  const config = {
    userDataDir: overrides.userDataDir || getUserDataDir(),
    viewport: {
      ...DEFAULT_CONFIG.viewport,
      ...(overrides.viewport || {})
    },
    userAgent: overrides.userAgent || DEFAULT_CONFIG.userAgent,
    args: overrides.args || [...DEFAULT_CONFIG.args]
  };

  return config;
}

/**
 * 验证浏览器配置是否完整有效
 * @param {BrowserConfig} config - 浏览器配置对象
 * @returns {{ valid: boolean, errors: string[] }} 验证结果
 */
export function validateBrowserConfig(config) {
  const errors = [];

  // 检查 userDataDir
  if (!config.userDataDir || typeof config.userDataDir !== 'string') {
    errors.push('userDataDir 必须是有效的字符串路径');
  }

  // 检查 viewport
  if (!config.viewport) {
    errors.push('viewport 配置缺失');
  } else {
    if (typeof config.viewport.width !== 'number' || config.viewport.width < 1024) {
      errors.push('viewport.width 必须 >= 1024');
    }
    if (typeof config.viewport.height !== 'number' || config.viewport.height < 768) {
      errors.push('viewport.height 必须 >= 768');
    }
  }

  // 检查 userAgent
  if (!config.userAgent || typeof config.userAgent !== 'string') {
    errors.push('userAgent 必须是有效的字符串');
  } else if (!config.userAgent.includes('Mozilla') || !config.userAgent.includes('Chrome')) {
    errors.push('userAgent 必须包含真实的浏览器标识');
  }

  // 检查反检测参数
  if (!Array.isArray(config.args)) {
    errors.push('args 必须是数组');
  } else {
    const hasAntiDetection = config.args.some(arg => 
      arg.includes('AutomationControlled')
    );
    if (!hasAntiDetection) {
      errors.push('args 必须包含反检测参数 --disable-blink-features=AutomationControlled');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 创建 Playwright 浏览器上下文
 * @param {Partial<BrowserConfig>} [options] - 配置选项
 * @returns {Promise<{ context: BrowserContext, config: BrowserConfig, browserSource: string }>} 浏览器上下文和配置
 */
export async function createBrowserContext(options = {}) {
  const config = createBrowserConfig(options);
  const validation = validateBrowserConfig(config);
  
  if (!validation.valid) {
    throw new Error(`浏览器配置无效: ${validation.errors.join(', ')}`);
  }

  // 获取可用的浏览器路径
  const browserInfo = getAvailableBrowserPath();
  
  if (!browserInfo) {
    throw new Error('未找到可用的浏览器。请安装 Google Chrome 或运行: npx playwright install chromium');
  }

  console.error(`[Browser] 使用 ${browserInfo.source} 浏览器: ${browserInfo.path}`);

  // 使用 launchPersistentContext 以支持持久化用户数据
  const context = await chromium.launchPersistentContext(config.userDataDir, {
    headless: false,
    executablePath: browserInfo.path, // 使用检测到的浏览器
    viewport: config.viewport,
    userAgent: config.userAgent,
    args: config.args,
    ignoreHTTPSErrors: true,
    // 额外的反检测设置
    bypassCSP: true,
    javaScriptEnabled: true,
    // 模拟真实用户环境
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    // 权限设置
    permissions: ['geolocation', 'notifications'],
    // 设备像素比
    deviceScaleFactor: 2,
    // 禁用 WebDriver 标志
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  });

  return { context, config, browserSource: browserInfo.source };
}

/**
 * @typedef {Object} BrowserConfig
 * @property {string} userDataDir - 用户数据目录路径
 * @property {{ width: number, height: number }} viewport - 视口大小
 * @property {string} userAgent - 用户代理字符串
 * @property {string[]} args - 浏览器启动参数
 */
