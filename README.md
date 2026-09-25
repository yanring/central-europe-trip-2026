# 走慢一点，去中欧

Zijie & Hanyi · 2026-09-26 至 2026-10-06
研究快照：2026-09-25

## 打开

`index.html` 是完整单文件网页，包含样式、程序和所有攻略资料。
No package installation is required. The application, styles, and guide data are embedded in the HTML. Real place photos, maps, and source pages require an internet connection. Open it in a full JavaScript-capable browser.
附件预览和手机系统的文件预览可能只显示内容或不执行脚本，不等于完整浏览器。
地图、原始来源和运营方网站需要联网。

The guide is published on GitHub Pages at https://yanring.github.io/central-europe-trip-2026/. The owner explicitly authorized public access; the page includes the supplied itinerary and booking details. There is no shared editing backend: each browser keeps its own favorites and edits.

## 使用

- Start with one of four destination areas, then compare place cards and the linked map.
- Hover a card to highlight its marker; click a marker to return to the card. Hotels use H markers, with both Budapest stays selectable.
- Save places to the shortlist before planning transport. The original daily routes remain under “原行程参考”.
- 「编辑当天」：修改自由活动、起床时间和备注。票面交通不会误改。
- 「备选地点」：按城市、天气、类型筛选。点星标收藏，展开查看来源与营业时间。
- 「准备与实用」：逐项勾选预约、接送、行李与出行事项。包含交通票价、预算、雨天方案和英文留言模板。
- 「我的调整」：导出完整网页或 JSON 备份。将导出的文件发回对话，可以保留调整继续完善。

支持 localStorage 的浏览器会在本机保存修改，不会自动同步到同行人的设备。
浏览器不允许本地保存时，页面会显示「请导出备份」。
导出的 HTML 自带已选路线、收藏、备注及个人地点，打开后可继续修改。
清缓存、换设备或换文件前，请先导出。JSON 导入会替换当前个人修改，不替换本版固定研究资料。

## 内容范围

11 天；77 个地点；27 个原日方案参考；5 家酒店；6 段已提供的长途交通；
17 项准备事项；9 组实用信息；165 条来源或用户依据。
所有酒店和长途交通以用户最新版文字为准，没有假装重新读取订单。
游玩时刻、接驳耗时、预算均为建议，不是实时预订或运营保证。

重点更新：
- 使用 Lindner Hotel Prague Castle，不再按 Comfort Hotel 安排。
- 9/26 先预留落地后 3–4 小时，15:00 后入住休息。
- Gosausee 左岸有截至 9/30 的落石关闭公告；10/1 也不能推断自动恢复。
- 湖区公交公开 PDF 的季节区间不覆盖本次日期，未编造具体公交班次。
- Steegwirt 周一、周二不安排；Jiřák 市集在周六午前抵达。
- Jeff’s 接站、10/2 送站、TRIBE 晚到和退房后寄存都还需要落实。

## 源文件

- index.html：可直接使用的完整网页。
- guide-data.json：完整结构化研究、行程和来源。
- styles.css：样式源文件。
- app.js：交互源文件。
- map.js: destination map, hotel selection, and card/marker interaction.
- vendor/leaflet/: Leaflet 1.9.4 with its license; official SHA-256 integrity values were checked.
- scripts/build.py: standalone HTML generator and synchronization check.
- QA.md：本版验证范围与限制。

Edit `guide-data.json`, `styles.css`, `app.js`, and `map.js`, then run `python3 scripts/build.py` to rebuild the standalone `index.html`. Run `python3 scripts/build.py --check` and `node --check app.js` before committing. The build preserves the embedded personal-state seed and storage key. Push reviewed changes to `main`; GitHub Pages deploys automatically.

## 继续完善

把最新导出的 HTML 或 JSON 和新的预约回复发回原对话即可。
住宿与车票变化请明确说明，以免把已确认信息和游玩建议混在一起。

## City selection and map

The main flow is destination → place comparison → favorites. It does not assign new places to dates or automatically plan routes. There are 77 candidates across Budapest (15), Vienna (20), the lake region (20), and Prague (22), including food and rest stops. Outdoors, neighborhoods, and local experiences take priority; the existing art museum is optional.

Every place has an introduction, appearance, highlights, recommendation, tradeoffs, suggested timing, booking guidance, and a sourced representative map position. All five booked hotels have coordinates. Hovering or focusing a card highlights the matching marker; selecting a marker scrolls to the card. On mobile, use the map-location and return-to-card buttons. Hotel distances are explicitly straight-line distances, not walking/driving routes. Subvenues such as Zauner's branches and the Krippenstein cable-car base have distinct labels and map links.

76 places have visually checked real photos from venue or tourism sources. Kelet uses a photo-page link. Photos remain external URLs with source links and credits; no redistribution license is claimed. One St. Gilgen image is a small source thumbnail. Maps use OpenStreetMap standard tiles with visible attribution, default browser caching, and ordinary browser referrers. Only the visible viewport is requested; no tile prefetch or offline tile download is implemented. Static coordinates come from venue/tourism sources or a cached, rate-limited, one-time OpenStreetMap lookup; the website does not call a geocoding API.

The HTML embeds Leaflet, application code, styles, and guide data. Images, map tiles, and external pages require internet access. Image or map failure leaves the written guide and external source links usable. Personal edits remain local to each browser, with the original storage key and backup format preserved. New shared editing or cloud synchronization is outside this change.

Use a separate localhost origin for browser testing. Do not clear or reset the live website's browser storage as part of QA.

## Walks and experiences expansion

22 additional candidates appear before the previous entries in each city. They cover parks, walking neighborhoods, forest and vineyard trails, caves, a forest railway, cable-car scenery, gardens, and riverside markets. They are choices, not additions to the daily itinerary.

Seven trail cards show route length, accumulated ascent, indicative duration, difficulty, terrain, and route type. They distinguish one-way figures, estimated returns, approach walking, and transport. Missing official ascent figures remain explicitly unknown. The Divoká Šárka short variant has no measured total distance; it does not reuse the separate 9.3 km trail's figures. Search includes trail details, so searching for 徒步 can find the trail cards.

Important operating details were checked against primary sources: the Erzsébet lookout closure is preserved on the Normafa card; the Petřín funicular card uses the operator's September 2026 restart notice; the forest railway and seasonal garden/boat operations have their own cautions. Future opening and reservation availability are not guaranteed.

## Favorites-only copy

In 收藏与调整, 复制收藏清单 writes Markdown text grouped by city directly to the clipboard. It contains only selected places (including personal additions), place notes, experience/booking/trail details, map links, and relevant sources. It excludes unrelated places, full booking records, daily edits, and global notes. The full HTML and JSON backups remain available separately. If automatic clipboard access is unavailable or denied, a dialog selects the same text for manual copying. Favorites copy never starts a file download. The shortlist is for reading/sharing/planning; importing personal state still uses the original JSON backup.
