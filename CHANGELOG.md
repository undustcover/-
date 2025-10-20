# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-10-20

### Added
- 报表页新增「逾期任务明细」卡片：支持搜索、分页、日期范围联动。
- 前端 API 新增 `reportsApi.getOverdueTasks(params)`：获取 `/reports/tasks/overdue` 逾期任务列表。
- 后端新增 `GET /reports/tasks/overdue` 接口：支持 `start_date`、`end_date`、`department`、`user_id`、`keyword`、`page`、`limit` 筛选并分页返回逾期任务。

### Changed
- 报表页刷新流程统一调用逾期任务拉取，确保数据同步。
- Kanban 列表交互细节优化（示例：隐藏测试任务、已完成列禁止新增入口等）。
- 后端 CORS 策略更新：允许 `http://localhost:3000`，以支持本地开发联调。

### Notes
- 逾期判断：`status = 'overdue'` 或 `due_date < now` 且状态非 `completed/cancelled`。
- 逾期天数由后端统一计算并随接口返回。
- 访问权限限制：`manager` 角色可访问逾期任务报表。

---

## [1.4.0] - 2025-09-xx
- 历史版本记录略。