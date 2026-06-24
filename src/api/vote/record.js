import request from '@/utils/request'

// 查询投票记录列表
export function listRecord(query) {
  return request({ url: '/vote/record/list', method: 'get', params: query })
}

// 删除投票记录
export function delRecord(recordId) {
  return request({ url: '/vote/record/' + recordId, method: 'delete' })
}

// 清空某活动全部投票
export function clearRecord(activityId) {
  return request({ url: '/vote/record/clear/' + activityId, method: 'delete' })
}

// 统计看板数据
export function getStatistics(activityId) {
  return request({ url: '/vote/record/statistics/' + activityId, method: 'get' })
}
