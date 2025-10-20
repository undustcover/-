# v1.6.0

## Added
- 任务详情页新增「项目制详情」展板：显示合同编号、合同金额、年度营收计划、客户负责人、合同开始/结束日期、实际营收、实际价值工作量、实际成本；支持日期、货币、数值格式化与占位提示。

## Changed
- 创建/编辑任务对话框：提交成功后自动关闭并上抛 `success` 事件；列表页与详情抽屉监听成功事件后自动刷新。
- 任务详情编辑成功后自动导航：优先返回上一页，无历史则返回任务列表。

## Notes
- 仅在「项目管理」类别任务显示相关字段，切换到其他类别会自动清空并隐藏。

更多细节请参考 `CHANGELOG.md` 中的 1.6.0 版本说明。

# v1.5.0

## Added
- 报表页新增「逾期任务明细」卡片：支持搜索、分页、日期范围联动。
- 前端 API 新增 `reportsApi.getOverdueTasks(params)`：获取 `/reports/tasks/overdue` 逾期任务列表。
- 后端新增 `GET /reports/tasks/overdue` 接口：支持 `start_date`、`end_date`、`department`、`user_id`、`keyword`、`page`、`limit` 筛选并分页返回逾期任务。

## Changed
- 报表页刷新流程统一调用逾期任务拉取，确保数据同步。
- Kanban 列表交互细节优化（示例：隐藏测试任务、已完成列禁止新增入口等）。
- 后端 CORS 策略更新：允许 `http://localhost:3000`，以支持本地开发联调。

## Notes
- 逾期判断：`status = 'overdue'` 或 `due_date < now` 且状态非 `completed/cancelled`。
- 逾期天数由后端统一计算并随接口返回。
- 访问权限限制：`manager` 角色可访问逾期任务报表。

更多细节请参考 `CHANGELOG.md` 中的 1.5.0 版本说明。