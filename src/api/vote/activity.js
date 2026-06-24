import request from '@/utils/request'

// 查询投票活动列表
export function listActivity(query) {
  return request({ url: '/vote/activity/list', method: 'get', params: query })
}

// 查询投票活动详细
export function getActivity(activityId) {
  return request({ url: '/vote/activity/' + activityId, method: 'get' })
}

// 新增投票活动
export function addActivity(data) {
  return request({ url: '/vote/activity', method: 'post', data: data })
}

// 修改投票活动
export function updateActivity(data) {
  return request({ url: '/vote/activity', method: 'put', data: data })
}

// 修改活动状态
export function changeActivityStatus(activityId, status) {
  return request({ url: '/vote/activity/changeStatus', method: 'put', data: { activityId, status } })
}

// 删除投票活动
export function delActivity(activityId) {
  return request({ url: '/vote/activity/' + activityId, method: 'delete' })
}
