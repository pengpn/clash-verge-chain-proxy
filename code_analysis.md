这是一个 Clash 代理工具的配置脚本，用于动态修改 Clash 的配置文件。

  整体作用

  在现有机场订阅节点的基础上，构建一个链式代理（Proxy Chain）：

  你的流量 → 机场节点（自动优选最快的）→ 静态IP节点（洛杉矶）→ 目标网站

  ---
  分步解析

  1. 添加静态IP节点

  config.proxies.push({ name: '🇺🇸 静态IP-洛杉矶', type: 'socks5', ... })
  - 添加一个洛杉矶的 SOCKS5 静态IP节点
  - 关键字段 'dialer-proxy': autoSelectGroupName — 让这个节点的底层连接通过自动优选组建立，这就是链式的核心

  2. 收集机场节点

  const airportNodes = config.proxies.filter(p => !p.name.includes('🐯') && ...)
  - 过滤掉提示/广告类节点（含特定 emoji 或关键词的）
  - 排除刚添加的静态IP节点自身

  3. 创建自动优选组（url-test）

  { name: '⚡️ 自动优选 (入口)', type: 'url-test', interval: 300, tolerance: 50 }
  - 包含所有机场节点，每 300 秒测速一次
  - 自动选择延迟最低的节点作为入口
  - 如果组已存在则更新，否则新建并插到最前面

  4. 创建链式代理组（select）

  { name: '🔗 静态IP链式 (最终)', type: 'select', proxies: [staticProxyName] }
  - 只包含静态IP节点这一个选项
  - 作为最终出口暴露给其他策略组使用

  5. 注入到主要策略组

  const mainGroups = ['虎云', 'bing、onedrive', 'steam', 'pikpak']
  - 把链式代理组插入到这些策略组的节点列表中
  - 除 pikpak 外，都插到第一位（默认选中）
  - pikpak 插到第二位（splice(1, 0, ...)）

  ---
  数据流总结

  用户请求
    └─► 策略组（虎云/bing/steam/pikpak）
          └─► 🔗 静态IP链式（最终出口）
                └─► 🇺🇸 静态IP节点（socks5，dialer-proxy）
                      └─► ⚡️ 自动优选（入口，url-test）
                            └─► 机场节点（延迟最低者）
                                  └─► 目标网站

  目的：用机场的动态IP作为通道，最终让流量从固定的美国静态IP出去，实现 IP 固定化（适合需要稳定IP的服务，如 Bing、OneDrive 等）。