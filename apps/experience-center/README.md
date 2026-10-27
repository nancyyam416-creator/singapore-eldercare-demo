# U2G 四端体验中心

独立的跨终端入口页，不依赖也不改动四个业务端工程。

## 本地启动

```bash
npm install
npm run dev
```

固定地址：`http://localhost:53110/`。Vite 开启 `strictPort`，端口被占用时直接报错，不会自动递增。

## 入口地址配置

默认本地地址集中在 `src/entry-config.js`：

- `VITE_ADMIN_URL`：管理后台
- `VITE_ELDER_SCREEN_URL`：老人中控屏
- `VITE_ELDER_MOBILE_URL`：老人移动端
- `VITE_FAMILY_MOBILE_URL`：子女移动端

后续有正式发布地址时，通过同名 Vite 环境变量替换，不需要修改页面结构。
