/**
 * 部署通知脚本
 * 在成功部署后发送通知
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 部署信息
  deployment: {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    buildNumber: process.env.GITHUB_RUN_NUMBER || Date.now(),
    commitId: process.env.GITHUB_SHA || 'local-deploy',
    committer: process.env.GITHUB_ACTOR || 'developer'
  },
  
  // 通知渠道
  notifications: {
    // Webhook URL (如企业微信、钉钉、飞书等)
    webhook: process.env.NOTIFICATION_WEBHOOK,
    
    // 邮件通知配置
    email: {
      enabled: !!process.env.NOTIFICATION_EMAIL,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `FunnyGame.help 已部署 - v${process.env.npm_package_version || '1.0.0'}`
    }
  },
  
  // 部署的URL
  urls: {
    production: 'https://www.funnygame.help/',
    github: `https://${process.env.GITHUB_REPOSITORY_OWNER || 'yuanyijiealex'}.github.io/funnygame-help/`,
    spaceship: 'https://www.funnygame.help/'
  }
};

// 读取部署报告
function getDeploymentReport() {
  try {
    // 尝试读取构建产物信息
    const reportPath = path.join(__dirname, '../dist/build-info.json');
    if (fs.existsSync(reportPath)) {
      const reportData = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(reportData);
    }
  } catch (error) {
    console.error('读取部署报告失败:', error);
  }
  
  return {
    buildDate: new Date().toISOString(),
    version: config.deployment.version,
    deployedBy: config.deployment.committer
  };
}

// 发送Webhook通知
function sendWebhookNotification() {
  if (!config.notifications.webhook) {
    console.log('未配置Webhook URL，跳过Webhook通知');
    return;
  }
  
  const report = getDeploymentReport();
  
  // 构建通知内容
  const content = {
    msgtype: 'markdown',
    markdown: {
      content: `## 🚀 FunnyGame.help 已成功部署
      
**版本信息**
- 版本: ${report.version}
- 提交ID: ${config.deployment.commitId.substring(0, 7)}
- 提交者: ${config.deployment.committer}
- 部署时间: ${report.buildDate}

**访问链接**
- 生产环境: [www.funnygame.help](${config.urls.production})
- GitHub Pages: [查看](${config.urls.github})
- Spaceship: [查看](${config.urls.spaceship})

**部署统计**
- 构建编号: ${config.deployment.buildNumber}
- 环境: ${config.deployment.environment}
      `
    }
  };
  
  // 准备请求选项
  const webhookUrl = new URL(config.notifications.webhook);
  const requestOptions = {
    hostname: webhookUrl.hostname,
    path: webhookUrl.pathname + webhookUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // 发送请求
  const req = https.request(requestOptions, (res) => {
    console.log(`Webhook通知状态码: ${res.statusCode}`);
    
    res.on('data', (data) => {
      console.log(`Webhook响应: ${data}`);
    });
  });
  
  req.on('error', (error) => {
    console.error('发送Webhook通知时出错:', error);
  });
  
  req.write(JSON.stringify(content));
  req.end();
  
  console.log('Webhook通知已发送');
}

// 发送邮件通知
function sendEmailNotification() {
  if (!config.notifications.email.enabled) {
    console.log('未启用邮件通知，跳过');
    return;
  }
  
  console.log(`邮件通知将发送到: ${config.notifications.email.to}`);
  console.log('注意: 实际发送邮件需要SMTP服务，此处仅打印日志');
  
  // 实际项目中可以使用nodemailer等库发送邮件
}

// 主函数
function main() {
  console.log('开始发送部署通知...');
  
  try {
    // 发送Webhook通知
    sendWebhookNotification();
    
    // 发送邮件通知
    sendEmailNotification();
    
    console.log('部署通知发送完成');
  } catch (error) {
    console.error('发送通知时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 