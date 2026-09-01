/**
 * test_data.js —— 静态测试数据层
 *
 * 本文件只存放静态数据，不含任何业务逻辑。
 * 所有字段名称与《PRD-答题抽奖小程序.md》§5.3 数据模型保持一致，不做重命名、不做裁剪。
 * 后续接入后端接口时，只需替换本文件内容（或改为从接口拉取），data.js 无需改动。
 *
 * 派生字段（_id / activity_id / content_hash / created_at）由 data.js 在归一化时补全，
 * 避免在本文件中硬编码无业务含义的值。
 */

/* ============================================================
 * 1. 活动配置  → activity 表
 * ==========================================================*/
const ACTIVITY = {
  name: '2026 年安全生产知识竞赛',
  status: 'open', // draft | open | closed
  startAt: '2026-09-05 09:00:00',
  endAt: '2026-09-12 18:00:00',
  passScore: 3, // 通关阈值：5 题中答对 ≥3
  questionCount: 5, // 每次抽题数量
  winRate: 0.25, // 总中奖概率，恒定 25%
  weightMode: 'remain', // remain | fixed | initial —— 中奖后等级分配策略
  poolEmptyBehavior: 'close', // close | still-draw
  description:
    '本次活动共 150 道单选题，每次随机抽取 5 题，答对 3 题即可通关并参与抽奖。每人仅可抽奖一次。'
};

/* ============================================================
 * 2. 题库  → question 表（150 道单选题）
 * 字段：no, category, title, options{A,B,C,D}, answer, analysis, enabled
 * ==========================================================*/
const QUESTIONS = [

  /* ---------- 安全生产 ---------- */
  { no: 1, category: '安全生产', title: '我国安全生产工作的方针是？', options: { A: '效益优先、兼顾安全', B: '生产第一、安全第二', C: '安全第一、预防为主、综合治理', D: '谁主管、谁负责' }, answer: 'C', analysis: '《安全生产法》第三条确立"安全第一、预防为主、综合治理"的方针。', enabled: true },
  { no: 2, category: '安全生产', title: '生产经营单位的（ ）对本单位的安全生产工作全面负责。', options: { A: '安全总监', B: '班组长', C: '工会主席', D: '主要负责人' }, answer: 'D', analysis: '《安全生产法》第五条规定，主要负责人对本单位安全生产工作全面负责。', enabled: true },
  { no: 3, category: '安全生产', title: '新员工三级安全教育是指？', options: { A: '公司、车间、班组', B: '国家、省、市', C: '理论、实操、考核', D: '入职、转正、年度' }, answer: 'A', analysis: '三级安全教育指厂（公司）级、车间（部门）级、班组级。', enabled: true },
  { no: 4, category: '安全生产', title: '从业人员发现直接危及人身安全的紧急情况时，有权？', options: { A: '停止作业并撤离现场', B: '继续作业等待指令', C: '自行处理后再汇报', D: '征求同事意见' }, answer: 'A', analysis: '《安全生产法》第五十五条规定，从业人员有权停止作业或在采取可能的应急措施后撤离。', enabled: true },
  { no: 5, category: '安全生产', title: '特种作业人员必须取得（ ）方可上岗。', options: { A: '特种作业操作证', B: '健康证明', C: '学历证书', D: '岗位培训证明' }, answer: 'A', analysis: '特种作业人员须经专门培训并考核合格，取得特种作业操作证。', enabled: true },
  { no: 6, category: '安全生产', title: '安全色的四种基本颜色是？', options: { A: '红、白、黑、黄', B: '红、黄、蓝、绿', C: '红、橙、黄、绿', D: '黑、白、红、蓝' }, answer: 'B', analysis: 'GB 2893 规定安全色为红、蓝、黄、绿四种，对比色为黑白。', enabled: true },
  { no: 7, category: '安全生产', title: '安全色中红色表示？', options: { A: '指令', B: '禁止、停止', C: '警告', D: '提示' }, answer: 'B', analysis: '红色表示禁止、停止、消防和危险。', enabled: true },
  { no: 8, category: '安全生产', title: '安全帽的有效使用期限一般不超过？', options: { A: '2.5 年', B: '2 年', C: '1 年', D: '5 年' }, answer: 'A', analysis: '塑料安全帽从制造完成日起，有效使用期一般不超过 2.5 年。', enabled: true },
  { no: 9, category: '安全生产', title: '高处作业是指坠落高度基准面（ ）及以上。', options: { A: '2 米', B: '1.5 米', C: '3 米', D: '5 米' }, answer: 'A', analysis: 'GB/T 3608 规定，坠落高度基准面 2 米及以上即属高处作业。', enabled: true },
  { no: 10, category: '安全生产', title: '有限空间作业前必须进行的首要工作是？', options: { A: '办理审批', B: '准备工具', C: '通风换气与气体检测', D: '穿戴劳保用品' }, answer: 'C', analysis: '先通风、再检测、后作业，是有限空间作业的铁律。', enabled: true },
  { no: 11, category: '安全生产', title: '事故隐患排查治理的责任主体是？', options: { A: '安全监管部门', B: '行业协会', C: '生产经营单位', D: '保险公司' }, answer: 'C', analysis: '生产经营单位是事故隐患排查、治理和防控的责任主体。', enabled: true },
  { no: 12, category: '安全生产', title: '"三违"行为是指？', options: { A: '违规操作、违规用车、违规用电', B: '违法、违纪、违规', C: '违反合同、制度、流程', D: '违章指挥、违章作业、违反劳动纪律' }, answer: 'D', analysis: '"三违"即违章指挥、违章作业、违反劳动纪律。', enabled: true },
  { no: 13, category: '安全生产', title: '发生生产安全事故后，单位负责人应在（ ）内上报。', options: { A: '30 分钟', B: '1 小时', C: '2 小时', D: '24 小时' }, answer: 'B', analysis: '《生产安全事故报告和调查处理条例》规定 1 小时内如实报告。', enabled: true },
  { no: 14, category: '安全生产', title: '安全带的正确挂扣方式是？', options: { A: '低挂高用', B: '高挂低用', C: '平挂平用', D: '随意挂扣' }, answer: 'B', analysis: '安全带应高挂低用，挂在牢固的构件上，防止坠落冲击距离过大。', enabled: true },
  { no: 15, category: '安全生产', title: '电气设备着火时，首先应该？', options: { A: '用水灭火', B: '呼救撤离', C: '用泡沫灭火器', D: '切断电源' }, answer: 'D', analysis: '电气火灾必须先切断电源，再使用干粉或二氧化碳灭火器。', enabled: true },
  { no: 16, category: '安全生产', title: '生产安全事故等级中，死亡 3 人以上 10 人以下属于？', options: { A: '较大事故', B: '一般事故', C: '重大事故', D: '特别重大事故' }, answer: 'A', analysis: '较大事故：死亡 3–9 人，或重伤 10–49 人，或直接经济损失 1000 万–5000 万。', enabled: true },
  { no: 17, category: '安全生产', title: '机械设备转动部位必须设置？', options: { A: '防护罩', B: '警示标语', C: '照明灯', D: '操作规程牌' }, answer: 'A', analysis: '转动、传动部位必须安装防护罩或防护栏，做到"有轴必有套、有轮必有罩"。', enabled: true },
  { no: 18, category: '安全生产', title: '安全生产"四不放过"原则不包括？', options: { A: '事故原因未查清不放过', B: '整改资金未到位不放过', C: '责任人未处理不放过', D: '有关人员未受教育不放过' }, answer: 'B', analysis: '四不放过：原因未查清、责任人未处理、整改措施未落实、有关人员未受教育。', enabled: true },
  { no: 19, category: '安全生产', title: '作业现场"5S"管理中"整顿"的含义是？', options: { A: '清除无用物品', B: '清扫干净', C: '物品定位摆放、取用方便', D: '养成习惯' }, answer: 'C', analysis: '整理（去留）、整顿（定位）、清扫（清洁）、清洁（标准化）、素养（习惯）。', enabled: true },
  { no: 20, category: '安全生产', title: '动火作业前必须办理？', options: { A: '请假条', B: '用电申请', C: '动火作业许可证', D: '出入库单' }, answer: 'C', analysis: '动火作业实行许可管理，需办理动火证并落实监护人与灭火措施。', enabled: true },
  { no: 21, category: '安全生产', title: '从业人员有权拒绝？', options: { A: '加班安排', B: '安全培训', C: '岗位调动', D: '违章指挥和强令冒险作业' }, answer: 'D', analysis: '《安全生产法》第五十四条赋予从业人员拒绝违章指挥与强令冒险作业的权利。', enabled: true },
  { no: 22, category: '安全生产', title: '职业病防治工作坚持的方针是？', options: { A: '单位负责、政府监管', B: '治疗为主、预防为辅', C: '综合治理、分类管理', D: '预防为主、防治结合' }, answer: 'D', analysis: '《职业病防治法》确立"预防为主、防治结合"的方针。', enabled: true },
  { no: 23, category: '安全生产', title: '使用手持电动工具时应优先选用？', options: { A: 'I 类工具', B: '任意工具', C: 'II 类或 III 类工具', D: '自制工具' }, answer: 'C', analysis: 'II 类（双重绝缘）与 III 类（安全特低电压）工具安全性更高，潮湿场所尤其适用。', enabled: true },
  { no: 24, category: '安全生产', title: '企业应急预案演练频次要求是？', options: { A: '每年至少 1 次', B: '每季度至少 1 次', C: '每半年至少 1 次', D: '每两年 1 次' }, answer: 'C', analysis: '综合或专项应急预案演练每年至少 1 次，现场处置方案演练每半年至少 1 次。', enabled: true },
  { no: 25, category: '安全生产', title: '危险化学品储存应遵循的原则是？', options: { A: '混合存放节省空间', B: '就近堆放', C: '分类分区、禁忌物隔离', D: '露天存放' }, answer: 'C', analysis: '危化品须分类分区储存，性质相抵触、灭火方法不同的物品禁止混存。', enabled: true },
  { no: 26, category: '安全生产', title: '噪声作业场所 8 小时等效声级限值是？', options: { A: '85 dB', B: '80 dB', C: '70 dB', D: '90 dB' }, answer: 'A', analysis: 'GBZ 2.2 规定每周 5 天、每天 8 小时的噪声限值为 85 dB(A)。', enabled: true },
  { no: 27, category: '安全生产', title: '起重作业中"十不吊"不包括？', options: { A: '指挥信号不明不吊', B: '天气晴朗不吊', C: '吊物上有人不吊', D: '安全装置失灵不吊' }, answer: 'B', analysis: '"十不吊"针对信号不明、超载、斜拉、吊物站人、装置失灵等危险情形。', enabled: true },
  { no: 28, category: '安全生产', title: '安全标志中，警告标志的几何形状是？', options: { A: '正三角形', B: '圆形', C: '正方形', D: '菱形' }, answer: 'A', analysis: '警告标志为黄底黑边黑图案的正三角形。', enabled: true },
  { no: 29, category: '安全生产', title: '进入施工现场必须佩戴？', options: { A: '耳机', B: '墨镜', C: '安全帽', D: '手表' }, answer: 'C', analysis: '进入施工现场必须正确佩戴安全帽并系紧下颌带。', enabled: true },
  { no: 30, category: '安全生产', title: '安全生产责任制的核心是？', options: { A: '领导负责', B: '安全员负责', C: '人人有责、各负其责', D: '政府负责' }, answer: 'C', analysis: '安全生产责任制要求横向到边、纵向到底，全员覆盖。', enabled: true },

  /* ---------- 消防安全 ---------- */
  { no: 31, category: '消防安全', title: '我国消防工作的方针是？', options: { A: '扑救为主', B: '预防为主、防消结合', C: '安全第一', D: '综合治理' }, answer: 'B', analysis: '《消防法》第二条规定消防工作贯彻预防为主、防消结合的方针。', enabled: true },
  { no: 32, category: '消防安全', title: '全国消防宣传日是每年的？', options: { A: '1 月 19 日', B: '11 月 9 日', C: '9 月 11 日', D: '5 月 12 日' }, answer: 'B', analysis: '11 月 9 日与火警电话 119 数字相合，定为全国消防日。', enabled: true },
  { no: 33, category: '消防安全', title: '干粉灭火器压力表指针指向红区表示？', options: { A: '压力正常', B: '压力不足需充装', C: '压力过高', D: '可以正常使用' }, answer: 'B', analysis: '红区表示压力不足，绿区正常，黄区压力过高。', enabled: true },
  { no: 34, category: '消防安全', title: '使用干粉灭火器时，应瞄准火焰的？', options: { A: '上部', B: '根部', C: '中部', D: '任意位置' }, answer: 'B', analysis: '对准火焰根部左右扫射，才能有效隔绝可燃物。', enabled: true },
  { no: 35, category: '消防安全', title: '火灾中致人死亡的最主要原因是？', options: { A: '吸入有毒烟气窒息', B: '烧伤', C: '踩踏', D: '坠落' }, answer: 'A', analysis: '统计表明火灾死亡中约 70%–80% 死于烟气中毒与窒息。', enabled: true },
  { no: 36, category: '消防安全', title: '发生火灾时，正确的逃生姿势是？', options: { A: '弯腰低姿、湿毛巾捂口鼻', B: '直立快跑', C: '原地等待', D: '乘电梯下楼' }, answer: 'A', analysis: '烟气向上聚集，应弯腰低姿前行并用湿毛巾捂住口鼻。', enabled: true },
  { no: 37, category: '消防安全', title: '室内消火栓的水带长度一般为？', options: { A: '25 米', B: '20 米', C: '10 米', D: '50 米' }, answer: 'A', analysis: '室内消火栓配备的水带长度通常为 25 米。', enabled: true },
  { no: 38, category: '消防安全', title: '火灾初起阶段（3 分钟内）的最佳处置是？', options: { A: '立即逃离不管', B: '使用灭火器材扑救并报警', C: '打开门窗通风', D: '收拾贵重物品' }, answer: 'B', analysis: '初起火灾火势小、蔓延慢，是扑救的最佳时机。', enabled: true },
  { no: 39, category: '消防安全', title: '疏散通道和安全出口必须？', options: { A: '保持畅通，严禁占用封堵', B: '可以临时堆放物品', C: '上锁管理', D: '仅在检查时打开' }, answer: 'A', analysis: '疏散通道、安全出口必须保持畅通，严禁占用、堵塞、封闭。', enabled: true },
  { no: 40, category: '消防安全', title: '身上着火时正确的做法是？', options: { A: '快速奔跑', B: '用手拍打', C: '就地打滚或用厚重衣物压灭', D: '跳入水中' }, answer: 'C', analysis: '奔跑会助燃，应就地打滚或用厚重衣物覆盖压灭火苗。', enabled: true },
  { no: 41, category: '消防安全', title: '消防应急照明灯的连续供电时间不应少于？', options: { A: '10 分钟', B: '30 分钟', C: '20 分钟', D: '60 分钟' }, answer: 'B', analysis: '消防应急照明连续供电时间一般不少于 30 分钟。', enabled: true },
  { no: 42, category: '消防安全', title: '我国火警电话是？', options: { A: '110', B: '122', C: '120', D: '119' }, answer: 'D', analysis: '火警 119，匪警 110，急救 120，交通事故 122。', enabled: true },
  { no: 43, category: '消防安全', title: '灭火的基本方法不包括？', options: { A: '冷却法', B: '窒息法', C: '隔离法', D: '稀释法' }, answer: 'D', analysis: '基本方法为冷却、窒息、隔离、化学抑制四种。', enabled: true },
  { no: 44, category: '消防安全', title: '办公室电器长期不拔插头的主要风险是？', options: { A: '浪费电能', B: '缩短设备寿命', C: '影响网速', D: '待机发热引发火灾' }, answer: 'D', analysis: '长期通电待机会使元件发热老化，是常见火灾诱因。', enabled: true },
  { no: 45, category: '消防安全', title: '防火门的正常状态应该是？', options: { A: '常闭（或常开式火灾时自动关闭）', B: '常开', C: '拆除', D: '上锁' }, answer: 'A', analysis: '常闭防火门应保持关闭；常开防火门须在火灾时联动关闭。', enabled: true },
  { no: 46, category: '消防安全', title: '扑救带电设备火灾应选用？', options: { A: '泡沫灭火器', B: '清水灭火器', C: '沙土', D: '二氧化碳或干粉灭火器' }, answer: 'D', analysis: '二氧化碳与干粉灭火剂不导电，适用于带电设备火灾。', enabled: true },
  { no: 47, category: '消防安全', title: '消防车通道的净宽和净高不应小于？', options: { A: '2 米', B: '3 米', C: '6 米', D: '4 米' }, answer: 'D', analysis: '消防车通道净宽与净高均不应小于 4 米。', enabled: true },
  { no: 48, category: '消防安全', title: '高层建筑发生火灾时，正确的做法是？', options: { A: '乘电梯逃生', B: '躲进电梯间', C: '通过疏散楼梯向下或到避难层', D: '跳楼' }, answer: 'C', analysis: '火灾时严禁乘电梯，应走疏散楼梯，无法下行时进入避难层或上屋顶待援。', enabled: true },
  { no: 49, category: '消防安全', title: '烟感探测器的工作机理是探测？', options: { A: '温度升高', B: '火焰光波', C: '烟雾颗粒', D: '气体浓度' }, answer: 'C', analysis: '感烟探测器通过光电或离子方式探测烟雾颗粒。', enabled: true },
  { no: 50, category: '消防安全', title: 'ABC 干粉灭火器中的 "A" 类火灾指？', options: { A: '固体物质火灾', B: '液体火灾', C: '气体火灾', D: '金属火灾' }, answer: 'A', analysis: 'A 类固体、B 类液体或可熔固体、C 类气体、D 类金属、E 类带电、F 类烹饪物。', enabled: true },
  { no: 51, category: '消防安全', title: '消防演练中发现灭火器失效应？', options: { A: '自行丢弃', B: '挪作他用', C: '继续使用', D: '登记上报并及时更换' }, answer: 'D', analysis: '灭火器材须定期检查，失效的应立即上报更换并留下记录。', enabled: true },
  { no: 52, category: '消防安全', title: '安全出口指示标志应设置在？', options: { A: '地面中央', B: '距地面 1 米以下的墙面或地面', C: '天花板正中', D: '门后' }, answer: 'B', analysis: '低位设置是因为火灾时烟气在上层，低位标志更易辨识。', enabled: true },
  { no: 53, category: '消防安全', title: '电气线路老化的主要隐患是？', options: { A: '电压不稳', B: '耗电增加', C: '绝缘破损导致短路起火', D: '信号干扰' }, answer: 'C', analysis: '绝缘层老化破损会造成短路、漏电、电弧，引发火灾。', enabled: true },
  { no: 54, category: '消防安全', title: '消防控制室值班要求是？', options: { A: '24 小时双人持证值班', B: '8 小时有人', C: '工作日有人', D: '远程监控即可' }, answer: 'A', analysis: '消防控制室须 24 小时值班，每班不少于 2 人且持证上岗。', enabled: true },
  { no: 55, category: '消防安全', title: '燃气泄漏时，错误的处置是？', options: { A: '开关电器或使用明火', B: '关闭阀门开窗通风', C: '到户外拨打电话', D: '不要按动门铃' }, answer: 'A', analysis: '燃气泄漏时严禁开关任何电器与明火，避免电火花引爆。', enabled: true },
  { no: 56, category: '消防安全', title: '防火分区的作用是？', options: { A: '美化建筑', B: '方便管理', C: '控制火势蔓延范围', D: '节省建材' }, answer: 'C', analysis: '防火分区通过防火墙、防火门等把火势限制在一定区域内。', enabled: true },
  { no: 57, category: '消防安全', title: '灭火器压力表指针在绿区表示？', options: { A: '压力不足', B: '已失效', C: '压力过高', D: '压力正常' }, answer: 'D', analysis: '绿区为正常工作压力范围。', enabled: true },
  { no: 58, category: '消防安全', title: '单位应当至少（ ）组织一次防火检查。', options: { A: '每年', B: '每季度', C: '每半年', D: '每月' }, answer: 'D', analysis: '机关、团体、事业单位应至少每季度一次，企业至少每月一次防火检查。', enabled: true },
  { no: 59, category: '消防安全', title: '泡沫灭火器不适用于扑救？', options: { A: '带电设备火灾', B: '油类火灾', C: '固体物质火灾', D: '木材火灾' }, answer: 'A', analysis: '泡沫含水导电，不能用于带电设备火灾。', enabled: true },
  { no: 60, category: '消防安全', title: '拨打火警电话时应说明的内容不包括？', options: { A: '起火地点与燃烧物', B: '火势大小与有无人员被困', C: '报警人姓名与电话', D: '个人身份证号码' }, answer: 'D', analysis: '报警要点：地点、燃烧物、火势、人员被困情况、报警人联系方式。', enabled: true },

  /* ---------- 职业健康 ---------- */
  { no: 61, category: '职业健康', title: '职业病是指劳动者在（ ）中接触有害因素引起的疾病。', options: { A: '日常生活', B: '休假期间', C: '通勤途中', D: '职业活动' }, answer: 'D', analysis: '职业病是在职业活动中因接触粉尘、放射性物质和其他有毒有害因素而引起的疾病。', enabled: true },
  { no: 62, category: '职业健康', title: '我国法定职业病分为（ ）大类。', options: { A: '8 类', B: '12 类', C: '10 类', D: '15 类' }, answer: 'C', analysis: '《职业病分类和目录》将法定职业病分为 10 大类 132 种。', enabled: true },
  { no: 63, category: '职业健康', title: '用人单位应为接触职业病危害的劳动者建立？', options: { A: '职业健康监护档案', B: '工资档案', C: '考勤档案', D: '绩效档案' }, answer: 'A', analysis: '《职业病防治法》要求建立职业健康监护档案并妥善保存。', enabled: true },
  { no: 64, category: '职业健康', title: '职业健康监护包括上岗前、在岗期间和？', options: { A: '离岗时体检', B: '年度旅游', C: '家属体检', D: '入职体检' }, answer: 'A', analysis: '职业健康检查分上岗前、在岗期间、离岗时三类。', enabled: true },
  { no: 65, category: '职业健康', title: '尘肺病的主要致病因素是？', options: { A: '噪声', B: '振动', C: '高温', D: '长期吸入生产性粉尘' }, answer: 'D', analysis: '尘肺是长期吸入生产性矿物性粉尘并在肺内潴留所致。', enabled: true },
  { no: 66, category: '职业健康', title: '防尘综合措施中"八字方针"是？', options: { A: '控、监、测、评、防、护、救、报', B: '防、治、管、教、查、改、建、控', C: '*、扫、洒、通、戴、查、训、记', D: '革、水、密、风、护、管、教、查' }, answer: 'D', analysis: '防尘八字方针：革、水、密、风、护、管、教、查。', enabled: true },
  { no: 67, category: '职业健康', title: '长时间佩戴耳塞是为了预防？', options: { A: '职业性噪声聋', B: '尘肺', C: '近视', D: '皮肤病' }, answer: 'A', analysis: '噪声作业场所必须佩戴防噪耳塞或耳罩。', enabled: true },
  { no: 68, category: '职业健康', title: '高温作业是指工作地点平均 WBGT 指数？', options: { A: '≥25℃', B: '≥30℃', C: '≥35℃', D: '≥40℃' }, answer: 'A', analysis: 'WBGT 指数 ≥25℃ 的作业即属高温作业。', enabled: true },
  { no: 69, category: '职业健康', title: '中暑先兆的表现不包括？', options: { A: '皮肤干热无汗、意识模糊', B: '头晕、注意力不集中', C: '体温正常或略高', D: '大量出汗、口渴' }, answer: 'A', analysis: '皮肤干热无汗、意识模糊属重症中暑（热射病）表现。', enabled: true },
  { no: 70, category: '职业健康', title: '用人单位不得安排（ ）从事接触职业病危害的作业。', options: { A: '女职工', B: '实习生', C: '劳务派遣工', D: '未成年工' }, answer: 'D', analysis: '用人单位不得安排未成年工从事接触职业病危害的作业。', enabled: true },
  { no: 71, category: '职业健康', title: '职业健康检查费用由谁承担？', options: { A: '用人单位', B: '劳动者个人', C: '医保基金', D: '政府补贴' }, answer: 'A', analysis: '职业健康检查费用由用人单位承担。', enabled: true },
  { no: 72, category: '职业健康', title: '职业病危害告知不包括？', options: { A: '劳动合同告知', B: '警示标识告知', C: '培训告知', D: '竞争对手告知' }, answer: 'D', analysis: '告知方式包括合同、公告栏、警示标识、培训与体检结果告知。', enabled: true },
  { no: 73, category: '职业健康', title: '长时间伏案工作应每隔多久活动一次？', options: { A: '30 分钟', B: '2 小时', C: '1 小时', D: '4 小时' }, answer: 'C', analysis: '建议每工作 1 小时起身活动 5–10 分钟，预防肌肉骨骼损伤。', enabled: true },
  { no: 74, category: '职业健康', title: '工作场所采光照明不足容易导致？', options: { A: '听力下降', B: '皮肤病', C: '视力疲劳与近视', D: '高血压' }, answer: 'C', analysis: '照度不足会引起视疲劳、眼干涩，长期可致视力下降。', enabled: true },
  { no: 75, category: '职业健康', title: '用人单位应当在产生职业病危害的岗位设置？', options: { A: '警示标识与中文警示说明', B: '考勤机', C: '监控摄像头', D: '宣传海报' }, answer: 'A', analysis: '《职业病防治法》要求设置警示标识和中文警示说明。', enabled: true },
  { no: 76, category: '职业健康', title: '职业性苯中毒主要损害？', options: { A: '呼吸系统', B: '造血系统', C: '消化系统', D: '运动系统' }, answer: 'B', analysis: '苯主要损害造血系统，可致白细胞减少、再生障碍性贫血甚至白血病。', enabled: true },
  { no: 77, category: '职业健康', title: '使用有机溶剂作业时应佩戴？', options: { A: '棉纱口罩', B: '安全帽', C: '普通纱布手套', D: '防毒半面罩（配有机气体滤毒盒）' }, answer: 'D', analysis: '有机溶剂蒸气需使用配备有机气体滤毒盒的防毒面具。', enabled: true },
  { no: 78, category: '职业健康', title: '职业健康监护档案的保存期限是？', options: { A: '离职后 1 年', B: '离职后 3 年', C: '永久保存', D: '劳动者离开用人单位后至少 30 年' }, answer: 'D', analysis: '监护档案应在劳动者离职后至少保存 30 年（部分地区要求终身保存）。', enabled: true },
  { no: 79, category: '职业健康', title: '用人单位对疑似职业病病人应当？', options: { A: '直接辞退', B: '及时安排诊断，诊断期间不得解除劳动合同', C: '调岗降薪', D: '要求其自行就医' }, answer: 'B', analysis: '《职业病防治法》第五十五条规定，诊断或医学观察期间不得解除或终止劳动合同。', enabled: true },
  { no: 80, category: '职业健康', title: '工作场所职业病危害因素检测至少？', options: { A: '每月 1 次', B: '每三年 1 次', C: '每两年 1 次', D: '每年 1 次' }, answer: 'D', analysis: '职业病危害严重的用人单位应每年至少检测 1 次，每三年至少做 1 次现状评价。', enabled: true },
  { no: 81, category: '职业健康', title: '工效学伤害主要指？', options: { A: '化学中毒', B: '尘肺', C: '肌肉骨骼损伤', D: '中暑' }, answer: 'C', analysis: '不良作业姿势、重复动作、重体力搬运会导致肌肉骨骼损伤。', enabled: true },
  { no: 82, category: '职业健康', title: '搬运重物时正确的姿势是？', options: { A: '弯腰直接提起', B: '猛然发力', C: '屈膝下蹲、腰部挺直、靠近身体', D: '扭腰转身搬运' }, answer: 'C', analysis: '正确姿势为屈膝下蹲、腰背挺直、重物贴近身体，避免腰部扭伤。', enabled: true },
  { no: 83, category: '职业健康', title: '职业紧张（工作压力）可能导致的健康问题是？', options: { A: '近视', B: '骨折', C: '心血管疾病与心理障碍', D: '龋齿' }, answer: 'C', analysis: '长期职业紧张与高血压、冠心病、焦虑抑郁相关。', enabled: true },
  { no: 84, category: '职业健康', title: '用人单位发现职业病病人应报告至？', options: { A: '税务部门', B: '工商部门', C: '所在地卫生行政部门与劳动保障部门', D: '行业协会' }, answer: 'C', analysis: '确诊职业病后应向所在地卫生行政部门和劳动保障部门报告。', enabled: true },
  { no: 85, category: '职业健康', title: '劳动者享有职业卫生保护权利，不包括？', options: { A: '获得职业卫生教育、培训', B: '拒绝违章指挥和强令冒险作业', C: '要求用人单位改善工作条件', D: '无条件要求调换岗位' }, answer: 'D', analysis: '调岗需基于职业禁忌证等合理理由，不是无条件权利。', enabled: true },
  { no: 86, category: '职业健康', title: '紫外辐射作业应重点防护？', options: { A: '听力', B: '眼睛与皮肤', C: '呼吸道', D: '关节' }, answer: 'B', analysis: '紫外线可致电光性眼炎与皮肤灼伤，需佩戴防护面罩与防护服。', enabled: true },
  { no: 87, category: '职业健康', title: '工作场所应设置的生活卫生设施不包括？', options: { A: '更衣室', B: '洗浴间（必要时）', C: '娱乐场所', D: '休息室' }, answer: 'C', analysis: '应设置更衣、洗浴、休息、就餐等辅助用室，娱乐场所非必需。', enabled: true },
  { no: 88, category: '职业健康', title: '职业禁忌证是指？', options: { A: '遗传病', B: '所有慢性病', C: '传染病', D: '劳动者不宜从事的疾病或生理状态' }, answer: 'D', analysis: '职业禁忌证指劳动者从事特定职业或接触特定危害因素时更易受害的个体状态。', enabled: true },
  { no: 89, category: '职业健康', title: '手部接触强酸后应？', options: { A: '立即用大量流动清水冲洗 15 分钟以上', B: '用碱液中和', C: '用布擦拭', D: '涂抹药膏' }, answer: 'A', analysis: '化学灼伤首要处置是大量流动清水冲洗至少 15 分钟。', enabled: true },
  { no: 90, category: '职业健康', title: '职业病诊断应由（ ）承担。', options: { A: '取得资质的职业病诊断机构', B: '任意医院', C: '社区卫生服务中心', D: '用人单位医务室' }, answer: 'A', analysis: '职业病诊断须由省级以上卫生行政部门批准的医疗卫生机构承担。', enabled: true },

  /* ---------- 信息安全 ---------- */
  { no: 91, category: '信息安全', title: '下列密码中强度最高的是？', options: { A: 'Ks9#mQ2!xL', B: 'abc123', C: '123456', D: '公司名+2026' }, answer: 'A', analysis: '长度 ≥10 位、含大小写字母、数字与特殊字符且无规律的密码强度最高。', enabled: true },
  { no: 92, category: '信息安全', title: '收到"财务总监"要求紧急转账的邮件，正确的做法是？', options: { A: '立即转账', B: '不予理会也不核实', C: '转发给同事', D: '通过电话或当面二次确认后再处理' }, answer: 'D', analysis: '这是典型的商务邮件欺诈（BEC），必须通过独立渠道二次核实。', enabled: true },
  { no: 93, category: '信息安全', title: '钓鱼邮件最常见的识别特征是？', options: { A: '邮件有公司 logo', B: '发件人域名异常、内容制造紧迫感、附带可疑链接', C: '邮件有附件', D: '邮件在上班时间收到' }, answer: 'B', analysis: '域名仿冒、制造紧急氛围、诱导点击链接是钓鱼邮件的三大特征。', enabled: true },
  { no: 94, category: '信息安全', title: '离开工位时，电脑应该？', options: { A: '锁定屏幕（Win+L）', B: '保持原样', C: '关机', D: '盖上显示器' }, answer: 'A', analysis: '离开工位必须锁屏，Windows 快捷键 Win+L。', enabled: true },
  { no: 95, category: '信息安全', title: '办公电脑安装软件的正确做法是？', options: { A: '从任意网站下载', B: '让同事拷贝', C: '使用破解版', D: '通过公司软件中心或经 IT 审批后安装' }, answer: 'D', analysis: '未经授权的软件可能携带木马，须走正规渠道安装。', enabled: true },
  { no: 96, category: '信息安全', title: '公司涉密文件外发前应当？', options: { A: '直接发送', B: '发到个人邮箱', C: '按密级履行审批并加密传输', D: '用微信发送' }, answer: 'C', analysis: '涉密文件外发须履行审批流程，并采用加密或受控通道传输。', enabled: true },
  { no: 97, category: '信息安全', title: '两因素认证（2FA）的作用是？', options: { A: '提高登录速度', B: '自动记住密码', C: '减少密码长度', D: '即使密码泄露也能阻止未授权登录' }, answer: 'D', analysis: '2FA 在密码之外增加第二重验证，显著降低账号被盗风险。', enabled: true },
  { no: 98, category: '信息安全', title: '连接公共 Wi-Fi 处理公司业务的正确做法是？', options: { A: '直接连接使用', B: '关闭防火墙', C: '使用公司 VPN 加密通道', D: '使用手机热点即可不加防护' }, answer: 'C', analysis: '公共 Wi-Fi 存在中间人攻击风险，处理公司业务应走 VPN。', enabled: true },
  { no: 99, category: '信息安全', title: '发现电脑中毒后的第一步是？', options: { A: '自行格式化', B: '重启即可', C: '继续使用观察', D: '断网隔离并立即报告 IT' }, answer: 'D', analysis: '先断开网络防止横向扩散，再报告 IT 部门处置。', enabled: true },
  { no: 100, category: '信息安全', title: 'U 盘等移动介质的使用规范是？', options: { A: '随意借用', B: '专盘专用、接入前查杀病毒、涉密介质不外带', C: '个人与公司混用', D: '不需要管理' }, answer: 'B', analysis: '移动介质是病毒与泄密的主要载体，须专盘专用并先查杀。', enabled: true },
  { no: 101, category: '信息安全', title: '《数据安全法》将数据分为？', options: { A: '一般数据、重要数据、核心数据', B: '公开与秘密两类', C: '内部与外部两类', D: '一级至五级' }, answer: 'A', analysis: '国家建立数据分类分级保护制度，分为一般、重要、核心数据。', enabled: true },
  { no: 102, category: '信息安全', title: '个人信息处理的基本原则不包括？', options: { A: '合法、正当、必要', B: '目的明确与最小够用', C: '公开透明', D: '尽可能多采集' }, answer: 'D', analysis: '《个人信息保护法》强调最小必要原则，禁止过度收集。', enabled: true },
  { no: 103, category: '信息安全', title: '勒索软件的主要危害是？', options: { A: '加密文件并索要赎金', B: '仅弹出广告', C: '降低网速', D: '篡改桌面背景' }, answer: 'A', analysis: '勒索软件加密用户文件并勒索赎金，关键在于做好离线备份。', enabled: true },
  { no: 104, category: '信息安全', title: '防范勒索软件最有效的措施是？', options: { A: '安装杀毒软件即可', B: '定期离线备份 + 及时打补丁 + 不点可疑链接', C: '重装系统', D: '断网使用' }, answer: 'B', analysis: '纵深防御：备份、补丁、人员意识三者缺一不可。', enabled: true },
  { no: 105, category: '信息安全', title: '办公邮箱密码应？', options: { A: '长期使用不更换', B: '定期更换且与其他系统不重复', C: '告知同事备用', D: '写在便签上' }, answer: 'B', analysis: '密码应定期更换，且不同系统不得复用同一密码。', enabled: true },
  { no: 106, category: '信息安全', title: '社交工程攻击的本质是？', options: { A: '利用技术漏洞入侵', B: '物理破坏设备', C: '暴力破解密码', D: '利用人的心理弱点骗取信息' }, answer: 'D', analysis: '社交工程攻击针对人性弱点（信任、恐惧、贪婪）而非技术漏洞。', enabled: true },
  { no: 107, category: '信息安全', title: '废弃的纸质涉密文件应当？', options: { A: '扔进普通垃圾桶', B: '带回家', C: '卖给废品站', D: '使用碎纸机销毁' }, answer: 'D', analysis: '涉密纸质文件必须用碎纸机销毁，不得随意丢弃。', enabled: true },
  { no: 108, category: '信息安全', title: '公司数据备份的"3-2-1"原则指？', options: { A: '3 个管理员、2 台服务器、1 个机房', B: '3 天一次、2 份、1 个硬盘', C: '3 份数据、2 种介质、1 份异地', D: '3 个月、2 次、1 份' }, answer: 'C', analysis: '3 份副本、2 种不同介质、1 份异地（离线）保存。', enabled: true },
  { no: 109, category: '信息安全', title: '在社交媒体上发布信息时，不应？', options: { A: '分享个人生活', B: '转发官方新闻', C: '泄露公司未公开项目、内网截图、工牌信息', D: '发布活动照片' }, answer: 'C', analysis: '工牌、内网界面、未公开项目都属于可被利用的情报。', enabled: true },
  { no: 110, category: '信息安全', title: '操作系统提示有安全更新时应该？', options: { A: '忽略', B: '及时安装', C: '等半年再装', D: '关闭更新' }, answer: 'B', analysis: '安全补丁修复已知漏洞，应及时安装。', enabled: true },
  { no: 111, category: '信息安全', title: '二维码的安全风险是？', options: { A: '没有风险', B: '可能指向钓鱼网站或触发恶意下载', C: '仅会消耗流量', D: '会导致手机发热' }, answer: 'B', analysis: '恶意二维码可能诱导跳转钓鱼页面或自动下载木马。', enabled: true },
  { no: 112, category: '信息安全', title: '员工离职时，公司应？', options: { A: '及时回收账号权限并交接数据', B: '保留其全部账号', C: '仅收回门禁', D: '不做处理' }, answer: 'A', analysis: '离职应及时停用账号、回收权限、交接并审计数据。', enabled: true },
  { no: 113, category: '信息安全', title: '关于云盘存储公司文件，正确的是？', options: { A: '任意公有云盘均可', B: '使用公司批准的云盘并遵守密级规定', C: '用个人网盘更方便', D: '禁止使用一切云盘' }, answer: 'B', analysis: '须使用公司批准的云服务，涉密文件不得上传公共云盘。', enabled: true },
  { no: 114, category: '信息安全', title: '接到自称"IT 部门"索要密码的电话，应？', options: { A: '如实告知', B: '拒绝并挂断后通过官方渠道核实', C: '告知部分密码', D: '让对方自己查' }, answer: 'B', analysis: '正规 IT 部门不会索要密码，此类电话一律视为可疑。', enabled: true },
  { no: 115, category: '信息安全', title: '多因素认证中不属于"持有因素"的是？', options: { A: '指纹', B: '硬件令牌', C: '手机验证码', D: '门禁卡' }, answer: 'A', analysis: '指纹属于"固有因素"（生物特征），非持有因素。', enabled: true },
  { no: 116, category: '信息安全', title: '信息系统账号权限分配应遵循？', options: { A: '最大权限原则', B: '平均分配', C: '最小权限原则', D: '按需申请后永久保留' }, answer: 'C', analysis: '最小权限原则：只授予完成工作所必需的最小权限，并定期复核。', enabled: true },
  { no: 117, category: '信息安全', title: '数据脱敏的目的是？', options: { A: '提高数据精度', B: '压缩数据体积', C: '在保留可用性的同时消除敏感信息', D: '加快传输速度' }, answer: 'C', analysis: '脱敏通过遮蔽、替换等方式去除个人敏感信息，兼顾可用与安全。', enabled: true },
  { no: 118, category: '信息安全', title: '公司终端接入内网通常要求？', options: { A: '无需管控', B: '仅登记即可', C: '安装终端管控软件并通过合规检查', D: '使用个人设备' }, answer: 'C', analysis: '入网终端须安装管控软件、开启杀毒并通过安全基线检查。', enabled: true },
  { no: 119, category: '信息安全', title: '发生数据泄露事件后，企业应当在规定时限内？', options: { A: '隐瞒不报', B: '按规定向监管部门报告并通知受影响个人', C: '仅内部处理', D: '等待舆论平息' }, answer: 'B', analysis: '《数据安全法》《个人信息保护法》均要求及时报告与通知。', enabled: true },
  { no: 120, category: '信息安全', title: '下列哪项不属于良好的信息安全习惯？', options: { A: '定期更换密码', B: '及时锁屏', C: '开启系统更新', D: '多个系统使用同一密码便于记忆' }, answer: 'D', analysis: '密码复用会导致"一点破、全线破"，是高危习惯。', enabled: true },

  /* ---------- 公司制度 ---------- */
  { no: 121, category: '公司制度', title: '员工应于每月（ ）前完成上月考勤确认。', options: { A: '1 日', B: '3 日', C: '5 日', D: '10 日' }, answer: 'B', analysis: '公司考勤管理制度规定每月 3 日前完成确认。', enabled: true },
  { no: 122, category: '公司制度', title: '员工请假 3 天以上应提前（ ）提交申请。', options: { A: '1 个工作日', B: '3 个工作日', C: '5 个工作日', D: '7 个工作日' }, answer: 'B', analysis: '3 天以上假期需提前 3 个工作日走审批流程。', enabled: true },
  { no: 123, category: '公司制度', title: '年假未休完的处理方式通常是？', options: { A: '按公司制度结转至次年或折算工资', B: '自动作废', C: '不可结转', D: '累计永久有效' }, answer: 'A', analysis: '具体结转规则依公司制度执行，一般有截止期限。', enabled: true },
  { no: 124, category: '公司制度', title: '员工报销单据应在费用发生后（ ）内提交。', options: { A: '15 日', B: '60 日', C: '30 日', D: '90 日' }, answer: 'C', analysis: '费用报销应在发生后 30 日内提交，跨年度不予受理。', enabled: true },
  { no: 125, category: '公司制度', title: '公司保密协议约定的保密期限通常是？', options: { A: '在职期间', B: '无期限要求', C: '仅离职后 1 年', D: '在职及离职后一定期限内' }, answer: 'D', analysis: '保密义务一般持续至离职后约定年限（常见 2–3 年）。', enabled: true },
  { no: 126, category: '公司制度', title: '员工不得利用职务便利？', options: { A: '完成本职工作', B: '提出合理化建议', C: '参加公司培训', D: '收受供应商回扣或谋取不正当利益' }, answer: 'D', analysis: '廉洁自律是红线，收受回扣可能构成非国家工作人员受贿罪。', enabled: true },
  { no: 127, category: '公司制度', title: '发现同事有违规违纪行为应当？', options: { A: '视而不见', B: '在群里传播', C: '通过合规渠道如实反映', D: '替其隐瞒' }, answer: 'C', analysis: '公司设有举报渠道，鼓励实名举报并保护举报人。', enabled: true },
  { no: 128, category: '公司制度', title: '公司消防通道内严禁？', options: { A: '通行', B: '堆放杂物或停放车辆', C: '张贴标识', D: '安装照明' }, answer: 'B', analysis: '消防通道必须保持畅通，严禁占用、堵塞、封闭。', enabled: true },
  { no: 129, category: '公司制度', title: '员工入职后应在（ ）内完成安全生产培训。', options: { A: '1 周', B: '1 个月', C: '3 个月', D: '6 个月' }, answer: 'B', analysis: '新员工须在入职 1 个月内完成三级安全教育并考核合格。', enabled: true },
  { no: 130, category: '公司制度', title: '工作时间擅离岗位属于？', options: { A: '违反劳动纪律', B: '正常行为', C: '需部门批准即可', D: '不影响考核' }, answer: 'A', analysis: '擅离岗位违反劳动纪律，情节严重可依制度处分。', enabled: true },
  { no: 131, category: '公司制度', title: '公司资产管理原则是？', options: { A: '谁使用谁负责', B: '统一采购、登记入账、责任到人', C: '部门自行管理', D: '个人保管' }, answer: 'B', analysis: '固定资产须统一采购、建账、贴标并落实保管责任人。', enabled: true },
  { no: 132, category: '公司制度', title: '员工出差前应完成？', options: { A: '提交出差申请并获批准', B: '口头告知', C: '直接订票', D: '事后补办' }, answer: 'A', analysis: '出差须事前提交申请并完成审批，紧急情况可事后补办。', enabled: true },
  { no: 133, category: '公司制度', title: '公司会议决议的执行原则是？', options: { A: '自由执行', B: '由办公室全部承担', C: '仅记录不跟踪', D: '谁牵头、谁负责、限时反馈' }, answer: 'D', analysis: '会议决议应明确责任人、完成时限并纳入督办。', enabled: true },
  { no: 134, category: '公司制度', title: '员工个人信息变更（如手机号）应？', options: { A: '无需告知', B: '及时在人事系统更新', C: '告知同事即可', D: '年底统一更新' }, answer: 'B', analysis: '联系方式、银行卡等关键信息变更须及时更新，确保联络与发薪无误。', enabled: true },
  { no: 135, category: '公司制度', title: '公司提倡的沟通原则是？', options: { A: '越级汇报优先', B: '逐级沟通、必要时越级', C: '不沟通', D: '仅书面沟通' }, answer: 'B', analysis: '一般事项逐级沟通，重大或紧急事项可越级直至高层。', enabled: true },
  { no: 136, category: '公司制度', title: '办公区域节约用电要求是？', options: { A: '全天开灯', B: '无人时保持设备运行', C: '空调越低越好', D: '人走灯灭、空调设定合理温度' }, answer: 'D', analysis: '夏季空调不低于 26℃，离开时关闭灯具与设备电源。', enabled: true },
  { no: 137, category: '公司制度', title: '员工离职应提前（ ）书面通知公司。', options: { A: '3 日', B: '30 日', C: '15 日', D: '60 日' }, answer: 'B', analysis: '《劳动合同法》规定转正后离职需提前 30 日书面通知。', enabled: true },
  { no: 138, category: '公司制度', title: '公司印章使用的规定是？', options: { A: '保管人可自行决定', B: '任何人可借用', C: '须履行审批登记手续', D: '可带离公司' }, answer: 'C', analysis: '印章使用必须经审批并登记用印事由、份数与经办人。', enabled: true },
  { no: 139, category: '公司制度', title: '公司档案借阅应？', options: { A: '直接取走', B: '办理借阅登记并限期归还', C: '拍照留存即可', D: '无需登记' }, answer: 'B', analysis: '档案借阅须登记、限期归还，涉密档案需专项审批。', enabled: true },
  { no: 140, category: '公司制度', title: '员工在对外场合代表公司发言应？', options: { A: '随意表达个人观点', B: '以个人名义即可', C: '经授权并遵守对外口径管理规定', D: '转发未经核实的信息' }, answer: 'C', analysis: '对外发言实行归口管理，未经授权不得代表公司表态。', enabled: true },
  { no: 141, category: '公司制度', title: '公司采购流程的第一步是？', options: { A: '直接联系供应商', B: '签订合同', C: '提交采购需求并完成预算审批', D: '付款' }, answer: 'C', analysis: '先有需求与预算审批，再进入询价、比价与合同环节。', enabled: true },
  { no: 142, category: '公司制度', title: '供应商管理的核心要求是？', options: { A: '资质审查、履约评价与廉洁承诺', B: '价格最低即可', C: '长期合作免审', D: '关系优先' }, answer: 'A', analysis: '供应商须通过资质审查并签署廉洁协议，定期履约评价。', enabled: true },
  { no: 143, category: '公司制度', title: '公司绩效考核周期通常是？', options: { A: '月度', B: '半年', C: '季度 + 年度', D: '不定期' }, answer: 'C', analysis: '多数企业采用季度考核与年度考核相结合的方式。', enabled: true },
  { no: 144, category: '公司制度', title: '员工参加外部培训的费用处理是？', options: { A: '一律公司承担', B: '一律个人承担', C: '按培训协议约定，可能涉及服务期', D: '无需约定' }, answer: 'C', analysis: '专项培训可约定服务期与违约金，违约金不超过培训费用。', enabled: true },
  { no: 145, category: '公司制度', title: '公司车辆使用应？', options: { A: '私人随意使用', B: '提前申请、登记里程、禁止私用', C: '谁有钥匙谁用', D: '无需记录' }, answer: 'B', analysis: '公务车辆须申请派车、登记使用记录，严禁公车私用。', enabled: true },
  { no: 146, category: '公司制度', title: '员工健康体检的频次一般是？', options: { A: '每季度 1 次', B: '每年 1 次', C: '每两年 1 次', D: '不定期' }, answer: 'B', analysis: '公司一般每年组织一次全员健康体检，特殊岗位按法规加检。', enabled: true },
  { no: 147, category: '公司制度', title: '公司质量管理体系方针是？', options: { A: '产量优先', B: '质量第一、持续改进、顾客满意', C: '成本优先', D: '速度优先' }, answer: 'B', analysis: '质量方针通常围绕质量优先、持续改进与顾客满意展开。', enabled: true },
  { no: 148, category: '公司制度', title: '客户投诉处理的首要原则是？', options: { A: '推诿责任', B: '及时响应、先处理情绪再处理问题', C: '等待客户冷静', D: '转交他人' }, answer: 'B', analysis: '投诉处理强调首问负责、限时响应、闭环反馈。', enabled: true },
  { no: 149, category: '公司制度', title: '公司合理化建议渠道是？', options: { A: '通过意见箱、提案系统或员工座谈会', B: '没有渠道', C: '仅向领导口头提', D: '外部媒体' }, answer: 'A', analysis: '公司设有合理化建议渠道并对采纳建议给予奖励。', enabled: true },
  { no: 150, category: '公司制度', title: '本次答题抽奖活动的奖品领取方式是？', options: { A: '邮寄到家', B: '无需核销', C: '自动发放到工资', D: '凭工号与姓名到指定地点现场核销领取' }, answer: 'D', analysis: '奖品须本人凭工号与姓名现场核销，名单以后台记录为准。', enabled: true },
];

/* ============================================================
 * 3. 奖品池  → prize 表
 * 字段：level, name, total, remain, weight, sort
 * ==========================================================*/
const PRIZES = [
  { level: 1, name: '一等奖', desc: '智能手表', total: 5, remain: 5, weight: 0, sort: 1 },
  { level: 2, name: '二等奖', desc: '蓝牙耳机', total: 50, remain: 50, weight: 0, sort: 2 },
  { level: 3, name: '三等奖', desc: '定制保温杯', total: 100, remain: 100, weight: 0, sort: 3 }
];

/* ============================================================
 * 4. 参与者  → participant 表
 * 字段：name, empNo, openid, passed, passedAt, drawn, drawnAt
 * ==========================================================*/
const PARTICIPANTS = [
  { name: '张伟', empNo: 'A10086', openid: 'o-test-0001', passed: true, passedAt: '2026-09-05 09:12:30', drawn: true, drawnAt: '2026-09-05 09:13:05' },
  { name: '李静', empNo: 'A10087', openid: 'o-test-0002', passed: true, passedAt: '2026-09-05 09:20:11', drawn: false, drawnAt: null },
  { name: '王强', empNo: 'A10088', openid: 'o-test-0003', passed: false, passedAt: null, drawn: false, drawnAt: null },
  { name: '刘芳', empNo: 'A10089', openid: 'o-test-0004', passed: true, passedAt: '2026-09-05 10:02:44', drawn: true, drawnAt: '2026-09-05 10:03:12' }
];

/* ============================================================
 * 5. 中奖记录  → lottery_record 表
 * 字段：name, empNo, level, prizeName, wonAt, remark
 * ==========================================================*/
const LOTTERY_RECORDS = [
  { name: '张伟', empNo: 'A10086', level: 3, prizeName: '三等奖 · 定制保温杯', wonAt: '2026-09-05 09:13:05', remark: '' },
  { name: '刘芳', empNo: 'A10089', level: null, prizeName: null, wonAt: '2026-09-05 10:03:12', remark: '谢谢参与' }
];

/* ============================================================
 * 6. 答题记录  → exam_record 表
 * 字段：empNo, questionNos, answers, correctCount, passed, submittedAt
 * ==========================================================*/
const EXAM_RECORDS = [
  { empNo: 'A10086', questionNos: [3, 17, 42, 58, 71], answers: ['A', 'B', 'B', 'B', 'B'], correctCount: 4, passed: true, submittedAt: '2026-09-05 09:12:30' },
  { empNo: 'A10086', questionNos: [1, 8, 22, 45, 63], answers: ['A', 'C', 'A', 'B', 'B'], correctCount: 5, passed: true, submittedAt: '2026-09-05 09:18:02' },
  { empNo: 'A10088', questionNos: [5, 19, 33, 49, 66], answers: ['A', 'B', 'B', 'B', 'B'], correctCount: 2, passed: false, submittedAt: '2026-09-05 10:15:20' }
];

/* ============================================================
 * 7. 后台管理员  → admin 表
 * ==========================================================*/
const ADMINS = [
  { username: 'admin', password: 'admin123', name: '系统管理员', role: 'super' },
  { username: 'safety', password: 'safety123', name: '安全管理部', role: 'operator' }
];

/* ============================================================
 * 8. 题库导入模板（供后台下载与示例填充）
 * ==========================================================*/
const IMPORT_TEMPLATE = [
  { 题号: 1, 题干: '示例：灭火器的压力表指针在绿区表示？', 选项A: '压力不足', 选项B: '压力正常', 选项C: '压力过高', 选项D: '已失效', 正确答案: 'B', 解析: '绿区为正常工作压力范围。' }
];

module.exports = { ACTIVITY, QUESTIONS, PRIZES, PARTICIPANTS, LOTTERY_RECORDS, EXAM_RECORDS, ADMINS, IMPORT_TEMPLATE };
