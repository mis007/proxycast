/**
 * @file browser-config.property.test.js
 * @description 浏览器配置属性测试
 * 
 * **Property 2: 浏览器配置完整性**
 * **Validates: Requirements 3.2, 3.3**
 * 
 * *For any* Playwright 浏览器配置对象，该配置应该：
 * - 包含有效的 `userDataDir` 路径
 * - 包含反检测所需的启动参数
 * - 设置合理的视口大小（宽度 >= 1024，高度 >= 768）
 * - 包含真实的用户代理字符串
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { 
  createBrowserConfig, 
  validateBrowserConfig, 
  DEFAULT_CONFIG,
  getUserDataDir 
} from '../browser-context.js';

describe('Property 2: 浏览器配置完整性', () => {
  
  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 默认创建的浏览器配置，应该包含有效的 userDataDir 路径
   */
  test('默认配置应包含有效的 userDataDir 路径', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // 不需要生成输入，测试默认行为
        () => {
          const config = createBrowserConfig();
          
          // userDataDir 必须是非空字符串
          assert.strictEqual(typeof config.userDataDir, 'string');
          assert.ok(config.userDataDir.length > 0, 'userDataDir 不能为空');
          
          // 应该包含 .lime 目录
          assert.ok(
            config.userDataDir.includes('.lime') || 
            config.userDataDir.includes('lime'),
            'userDataDir 应该在 lime 相关目录下'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 生成的视口配置，宽度应 >= 1024，高度应 >= 768
   */
  test('视口大小应满足最小要求', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 1024, max: 3840 }),
          height: fc.integer({ min: 768, max: 2160 })
        }),
        (viewport) => {
          const config = createBrowserConfig({ viewport });
          const validation = validateBrowserConfig(config);
          
          // 配置应该有效
          assert.ok(validation.valid, `配置应该有效: ${validation.errors.join(', ')}`);
          
          // 视口尺寸应该符合要求
          assert.ok(config.viewport.width >= 1024, '宽度应 >= 1024');
          assert.ok(config.viewport.height >= 768, '高度应 >= 768');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 小于最小要求的视口配置，验证应该失败
   */
  test('小于最小要求的视口应验证失败', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            width: fc.integer({ min: 1, max: 1023 }),
            height: fc.integer({ min: 768, max: 2160 })
          }),
          fc.record({
            width: fc.integer({ min: 1024, max: 3840 }),
            height: fc.integer({ min: 1, max: 767 })
          })
        ),
        (viewport) => {
          const config = {
            userDataDir: '/tmp/test',
            viewport,
            userAgent: DEFAULT_CONFIG.userAgent,
            args: DEFAULT_CONFIG.args
          };
          const validation = validateBrowserConfig(config);
          
          // 配置应该无效
          assert.ok(!validation.valid, '小于最小要求的视口应验证失败');
          assert.ok(validation.errors.length > 0, '应该有错误信息');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 默认配置，应包含反检测启动参数
   */
  test('默认配置应包含反检测启动参数', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const config = createBrowserConfig();
          
          // 必须包含 AutomationControlled 禁用参数
          const hasAntiDetection = config.args.some(arg => 
            arg.includes('AutomationControlled')
          );
          assert.ok(hasAntiDetection, '应包含 --disable-blink-features=AutomationControlled');
          
          // args 应该是数组
          assert.ok(Array.isArray(config.args), 'args 应该是数组');
          assert.ok(config.args.length > 0, 'args 不应为空');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 默认配置，应包含真实的用户代理字符串
   */
  test('默认配置应包含真实的用户代理字符串', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const config = createBrowserConfig();
          
          // userAgent 必须是字符串
          assert.strictEqual(typeof config.userAgent, 'string');
          
          // 必须包含 Mozilla 标识
          assert.ok(
            config.userAgent.includes('Mozilla'),
            'userAgent 应包含 Mozilla'
          );
          
          // 必须包含 Chrome 标识
          assert.ok(
            config.userAgent.includes('Chrome'),
            'userAgent 应包含 Chrome'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 自定义 userDataDir，配置应正确使用该路径
   */
  test('自定义 userDataDir 应被正确使用', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        (customPath) => {
          const config = createBrowserConfig({ userDataDir: customPath });
          
          // 应该使用自定义路径
          assert.strictEqual(config.userDataDir, customPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 缺少反检测参数的配置，验证应该失败
   */
  test('缺少反检测参数的配置应验证失败', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string().filter(s => !s.includes('AutomationControlled')), { minLength: 0, maxLength: 10 }),
        (args) => {
          const config = {
            userDataDir: '/tmp/test',
            viewport: { width: 1920, height: 1080 },
            userAgent: DEFAULT_CONFIG.userAgent,
            args
          };
          const validation = validateBrowserConfig(config);
          
          // 配置应该无效
          assert.ok(!validation.valid, '缺少反检测参数应验证失败');
          assert.ok(
            validation.errors.some(e => e.includes('反检测参数')),
            '错误信息应提及反检测参数'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 2: 浏览器配置完整性
   * 
   * *For any* 完整有效的配置，验证应该通过
   */
  test('完整有效的配置应验证通过', () => {
    fc.assert(
      fc.property(
        fc.record({
          userDataDir: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          viewport: fc.record({
            width: fc.integer({ min: 1024, max: 3840 }),
            height: fc.integer({ min: 768, max: 2160 })
          }),
          userAgent: fc.constant(DEFAULT_CONFIG.userAgent),
          args: fc.constant([...DEFAULT_CONFIG.args])
        }),
        (config) => {
          const validation = validateBrowserConfig(config);
          
          // 配置应该有效
          assert.ok(validation.valid, `配置应该有效: ${validation.errors.join(', ')}`);
          assert.strictEqual(validation.errors.length, 0, '不应有错误');
        }
      ),
      { numRuns: 100 }
    );
  });
});
