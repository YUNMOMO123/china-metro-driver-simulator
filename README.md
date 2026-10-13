# 轨道指挥室 · 地铁驾驶模拟器

一款无需安装的中文网页游戏。选择上海、北京、广州、深圳、成都的代表线路，控制列车牵引和制动，按站停车，并处理随机运营事件。

## 玩法

1. 打开 `dist/index.html`，选择线路，点击「开始驾驶」。
2. 关闭车门，将档位推到 P1–P4 加速。靠近车站时切换 B1–B3 制动。
3. 在站台中心约 35 米内停稳后开门，完成停站并获得评分。
4. 用 ↑ / ↓ 调整档位，空格键紧急制动。行车中留意限速与调度提示。

也可以用任意静态 HTTP 服务器托管 `dist/`。应用没有构建步骤和运行时依赖。

## 线路与数据

游戏采用真实站名与站序：上海 1 号线、北京 2 号线外环、广州 1 号线、深圳 1 号线、成都 1 号线韦家碾至科学城方向。站间距离由线路总里程分配得到，限速、车辆加减速、调度事件、评分及模拟时间均为游戏化设计，不代表真实行车规则。

线路核对资料：

- [上海市政府：1 号线莘庄至富锦路、28 站、约 36.9 公里](https://www.shanghai.gov.cn/cmsres/0e/0e715dde26ed457ca1ef9b57c91649f2/1a46ee743be770f6405a5b299439523a.pdf)
- [北京地铁：2 号线站点列表](https://www.bjsubway.com/station/xltcx/?id=1)
- [广州市规划和自然资源局：1 号线西塱至广州东站、18.5 公里](https://ghzyj.gz.gov.cn/hdjlpt/yjzj/api/attachments/view/e24d4cc3fc4baebb78af3f46637db0f2)
- [深圳市政府：1 号线沿途站点](https://www.sz.gov.cn/xxgk/sydwxxgk/jt/dt/ywxx/dtxlxx/content/mpost_11086804.html)
- [深圳地铁集团：1 号线罗湖至机场东、40.92 公里](https://www.szmc.net/SMARTC/upload/file/20250627/1750986736853070484.pdf)
- [成都 1 号线韦家碾至科学城方向站点](https://cd.bendibao.com/ditie/xl_13.shtml)

独立创作的模拟游戏，与地铁运营方无关。

