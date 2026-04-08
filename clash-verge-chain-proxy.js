// Clash Verge 链式代理配置脚本
// 功能：在订阅更新后自动添加静态IP链式代理配置
// 作者：https://github.com/[your-username]

function main(config, profileName) {
  // ========== 配置区域 - 请修改以下信息 ==========
  const staticProxyName = '🇺🇸 静态IP-洛杉矶'  // 静态IP节点名称
  const staticProxyConfig = {
    type: 'socks5',           // 协议类型：socks5/http/ss/trojan等
    server: 'YOUR_IP_HERE',   // 静态IP地址
    port: 443,                // 端口
    username: 'YOUR_USERNAME_HERE',  // 用户名
    password: 'YOUR_PASSWORD_HERE',  // 密码
    udp: true                 // 是否启用UDP
  }

  const autoSelectGroupName = '⚡️ 自动优选 (入口)'  // 自动优选组名称
  const chainGroupName = '🔗 静态IP链式 (最终)'    // 链式代理组名称

  // 需要添加链式代理选项的策略组
  const targetGroups = ['虎云', 'bing、onedrive', 'steam', 'pikpak']
  // ========== 配置区域结束 ==========

  config.proxies = config.proxies || []
  config['proxy-groups'] = config['proxy-groups'] || []
  config.rules = config.rules || []

  // 1. 添加静态IP节点（如果不存在）
  if (!config.proxies.find(p => p.name === staticProxyName)) {
    config.proxies.push({
      name: staticProxyName,
      ...staticProxyConfig,
      'dialer-proxy': autoSelectGroupName  // 通过自动优选组连接
    })
  }

  // 2. 收集所有正常的机场节点（排除提示节点和静态IP节点）
  const airportNodes = config.proxies.filter(p =>
    !p.name.includes('🐯') &&
    !p.name.includes('使用') &&
    !p.name.includes('联系') &&
    p.name !== staticProxyName
  ).map(p => p.name)

  // 3. 创建自动优选组（url-test类型，自动测速选择最快节点）
  let autoSelectGroup = config['proxy-groups'].find(g => g.name === autoSelectGroupName)
  if (!autoSelectGroup) {
    config['proxy-groups'].unshift({
      name: autoSelectGroupName,
      type: 'url-test',
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,    // 每300秒测速一次
      tolerance: 50,    // 延迟差50ms以内不切换
      proxies: airportNodes
    })
  } else {
    autoSelectGroup.type = 'url-test'
    autoSelectGroup.url = 'http://www.gstatic.com/generate_204'
    autoSelectGroup.interval = 300
    autoSelectGroup.tolerance = 50
    autoSelectGroup.proxies = airportNodes
  }

  // 4. 创建链式代理组（select类型，手动选择）
  let chainGroup = config['proxy-groups'].find(g => g.name === chainGroupName)
  if (!chainGroup) {
    config['proxy-groups'].unshift({
      name: chainGroupName,
      type: 'select',
      proxies: [staticProxyName]
    })
  } else {
    chainGroup.type = 'select'
    chainGroup.proxies = [staticProxyName]
  }

  // 5. 将链式代理组添加到目标策略组
  targetGroups.forEach(groupName => {
    const group = config['proxy-groups'].find(g => g.name === groupName)
    if (group && group.proxies) {
      // 移除已存在的链式代理组（避免重复）
      group.proxies = group.proxies.filter(p => p !== chainGroupName)
      // 添加到第一位
      if (groupName === 'pikpak') {
        // pikpak 组保持原有顺序，但添加链式代理
        group.proxies.splice(1, 0, chainGroupName)
      } else {
        group.proxies.unshift(chainGroupName)
      }
    }
  })

  return config
}
