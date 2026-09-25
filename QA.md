# Daily weather and branding verification — 2026-09-25

- Retrieved six Open-Meteo locations in one batch and saved 15 matching local-date forecasts for all 11 itinerary days. Time zones, coordinate proximity, returned units, array lengths, temperature order, precipitation probabilities, and nonnegative wind/precipitation values were validated.
- Weather values are from one provider; the initial comparison weather lookup was not mixed into the displayed data. Wind values were converted from km/h to m/s.
- Targeted checks exercised zero versus missing values, rain-code hints, missing forecast fallback, distant-trend labels, and the warning after 24 hours. Transfer-day tests verified Prague and Budapest airport on 4 October.
- Real browser at an isolated localhost origin rendered 11 weather cards and 15 location blocks; the last four dates were labeled distant trends. The original daily-reference page also displayed the correct two weather locations on 4 October.
- At 390×844, inspected the mobile weather page: daily low/high temperatures were visible in the first card, all six mobile navigation entries fit, and no horizontal overflow was observed. The viewport override was reset. No JavaScript console errors were observed.
- Personal-name branding was absent from app.js, index.html, guide-data.json, and README. All 77 place records, hotels, transport, checklist, practical notes, original day content, and the personal-state seed were preserved; days only gained weather-location references.
- JavaScript and Python syntax, standalone bundle synchronization, and whitespace checks passed. Live-site browser data was not reset or cleared.

Limitations: the forecast is a dated snapshot, distant dates are less reliable, city data do not represent mountain conditions, and daily extrema do not give arrival-time temperatures.

---

# AllTrails comparison verification — 2026-09-25

- Official MCP search and detail tools provided five exact provider IDs and their current returned rating/count values. Route names, descriptions and lengths were compared with this guide before classifying matches.
- Seven records: 2 close matches, 3 clearly identified alternative itineraries, and 2 unconfirmed entries without numeric scores. All original place fields and official trail facts remain unchanged after stripping the new comparison fields and added references; bookings and daily routes were unchanged.
- Real browser at an isolated localhost origin rendered all seven statuses and dates, with scores only on the five provider records. No JavaScript errors were observed.
- At 390×844, inspected the Ewige Wand alternative-route panel: its 9.3 km provider route, 4.2/16 score/count, and distinction from the guide's 2.2–3 km short walk were readable without horizontal overflow. The viewport override was reset.
- The real clipboard handler was exercised with an isolated adapter. It preserved the match labels, scores/counts, provider lengths and URLs, and snapshot dates. Unconfirmed entries remained unrated. The user's clipboard was not read or modified.
- JavaScript syntax, standalone bundle synchronization and whitespace checks passed. The displayed data are a snapshot and may differ from subsequently refreshed provider pages.

---

# Favorites clipboard update — 2026-09-25

- Favorites now copies Markdown text directly with the Clipboard API. Success is announced only after the write completes.
- Executed the real copy handler with an isolated clipboard adapter: selected records, custom places, notes, trail data, and map/source links were preserved; unrelated state was excluded.
- Rejected clipboard access and missing API both opened selected, read-only text for manual copying. Empty selection did not write. No favorites path invoked the download helper.
- Validation did not read or overwrite the user's system clipboard. JavaScript syntax, bundle synchronization, and whitespace checks passed.

---

# Favorites export verification — 2026-09-25

- The real export handler and download Blob were executed with three selected records across three cities, including a custom place and multiline notes. The Markdown contained the selected records, escaped note text, trail details, map/photo/source links, and city groups. Unselected places, global notes, and daily notes were excluded. Empty selection produced no download.
- In an isolated localhost browser, the export button was disabled for zero favorites and enabled after selecting Normafa. Clicking it created an actual Markdown file in Downloads; its contents were verified to contain exactly one selected record plus trail figures and map/source links. The browser automation download event timed out, so verification used the actual filesystem artifact. The test file was moved to Trash after verification.
- The test favorite was individually toggled off and the isolated tab was closed; live-site browser storage was not reset.
- JavaScript syntax and standalone HTML synchronization checks passed. Existing full HTML/JSON backup paths were retained.

---

# Candidate expansion verification — 2026-09-25

- Added 22 candidates from four destination-specific research agents: Budapest +5, Vienna +6, lake region +5, Prague +6. Total: 77 candidates and 76 real-place photographs.
- Original 55 candidate objects, hotels, transport, daily routes, checklist, practical notes, and personal-state seed remain unchanged. New candidates are displayed before previous entries within each city.
- Every new record has booking guidance, a sourced map position, a real image, experience/tradeoff/timing text, and valid source references. All 22 photos were visually checked during research or integration.
- Seven walking-route cards distinguish route length, accumulated ascent, indicative time, difficulty, terrain, and route type. Unknown values and unmeasured short variants are explicitly labeled; mountain elevation is not presented as ascent.
- The map and external-map links use the documented trail starts or explicitly labeled representative positions.
- JavaScript syntax, standalone bundle synchronization, whitespace checks, unique IDs, source integrity, and expected weather-filter categories passed.
- Real browser at a separate localhost origin: all-candidate card/marker counts matched 15/20/20/22; hotel counts remained 2/1/1/1; no horizontal overflow or JavaScript console errors were observed.
- At 390×844, the long Ewige Wand hiking facts rendered without overflow. Its real image loaded successfully. Temporary viewport override was reset.
- A newly added Stromovka favorite survived reload and appeared in the favorites filter and map; it was then individually toggled off. Live-site browser storage was not reset or cleared.

This verifies content structure and UI behavior, not future trail opening, weather, transport connections, or reservation availability. Original-release and city-explorer checks below are historical records.

---

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
