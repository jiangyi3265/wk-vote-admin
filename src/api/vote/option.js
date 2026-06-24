import request from '@/utils/request'

// 查询评选维度列表
export function listOption(query) {
  return request({ url: '/vote/option/list', method: 'get', params: query })
}

// 查询评选维度详细
export function getOption(optionId) {
  return request({ url: '/vote/option/' + optionId, method: 'get' })
}

// 新增评选维度
export function addOption(data) {
  return request({ url: '/vote/option', method: 'post', data: data })
}

// 修改评选维度
export function updateOption(data) {
  return request({ url: '/vote/option', method: 'put', data: data })
}

// 删除评选维度
export function delOption(optionId) {
  return request({ url: '/vote/option/' + optionId, method: 'delete' })
}
