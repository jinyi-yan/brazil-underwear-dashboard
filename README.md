# Brazil Underwear Intelligence

巴西 Shopee 女内衣裤选品可视化看板，基于友鹰数据导出结果构建。

## Features

- 累计销量 / 近 30 天热度双维度排序
- 热销商品、热销新品、类目与 lingerie 搜索词分析
- 商品标题、类目、店铺和商品 ID 筛选
- 每个商品可跳转到 Shopee 前台商品页，也保留友鹰原始链接
- 纯静态页面，可直接通过 GitHub Pages 发布

## Data note

网站内置了商品与搜索词数据，因此公开仓库和 GitHub Pages 页面上的数据都可被访问。近 30 天销量用于最新热度代理；源数据没有前月同比字段，页面不虚构增长率。

## Local preview

```bash
python3 -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。
