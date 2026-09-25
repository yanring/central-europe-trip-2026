# City explorer verification — 2026-09-25

- JavaScript syntax: `node --check app.js` and `node --check map.js` passed.
- Standalone bundle: `python3 scripts/build.py --check` passed.
- Data preservation: all booked transport, original hotel fields, checklist, practical notes, daily route IDs/steps, and embedded personal-state seed match the original deployed commit. Map metadata and candidate content were added.
- Data integrity: 55 unique candidates have booking/experience fields and regional coordinates; all internal source references resolve. All five hotels are mapped.
- Independent review: city/category/favorites list and marker sets matched across 24 combinations in an isolated harness. Map creation/removal was balanced across repeated view transitions.
- Real browser at a separate localhost origin: all four cities displayed matching card/marker counts (10/14/15/16) and their hotels (2/1/1/1). Map tiles loaded, desktop views had no horizontal overflow, and no JavaScript console errors were observed during these checks.
- Card interaction highlighted the corresponding marker and displayed its hotel distance. Switching Budapest hotels updated the distance from about 954 m to 16.1 km for Palace Quarter; both were labeled straight-line distances. City cards do not carry stale hotel-origin navigation links.
- Favorite changes updated marker styling and survived a page reload. The test favorite was toggled back individually; live-site browser storage was not cleared or reset.
- Visual QA: inspected the destination landing page and desktop map/card view. At 390×844, inspected the mobile card and map view, confirmed no horizontal overflow, and verified that the map-location button reached the selected marker. Temporary viewport override was reset.
- Original HTML/JSON backup logic was retained; it was reviewed for the added embedded map scripts. This update did not repeat the previous release's browser-download tests.

Limitations: photos and tiles depend on external hosts; not every image was viewed in the live browser. Source photographs were checked during research, but seasons and actual visiting conditions vary. Reservations are recommendations and official requirements, not confirmed bookings. Coordinates for large parks, neighborhoods, and lakes are representative anchors. The app does not measure road routes or guarantee opening hours or availability.

---

## Original attachment verification record

# 验证记录

验证日期：2026-09-25

- JavaScript：通过 `node --check`。
- 数据：全部来源 ID、路线地点 ID 有对应记录。
- Chromium 运行时：84 项断言通过，未记录 JavaScript 运行时错误。
- 覆盖：7 个主要页面；11 天和 27 条路线；搜索与收藏；新增地点；
  编辑行程与备注；清单勾选；湖区天气切换；HTML/JSON 导出与 JSON 导入。
- HTML 导出：对实际导出函数生成的 Blob 进行反序列化，
  在新页面重新载入，确认标题、自由行程、收藏、个人地点和备注得以保留。
- 布局：1440×1000 桌面、390×844 手机尺寸下主要页面无横向溢出；
  已查看首页、手机行程页、展开地点卡片的渲染截图。
- 用户输入：HTML 标签作为文本显示，不作为页面元素执行。

限制：
运行环境的 Chromium 禁止正常 URL / 本地文件导航，测试使用 set_content 渲染。
localStorage 的保存和重新读取逻辑使用内存 Storage 测试替身验证，
没有验证真实浏览器跨重启后的持久保存。
导出函数生成内容已验证，没有验证每种手机系统的文件下载/HTML 打开行为。
不允许本地保存的浏览器会显示导出提醒；使用时建议先做一次修改与导出。
未验证每个外部链接在用户设备上的连通性。
景点营业、交通运行和预约可用性不是软件测试可以保证的内容。
