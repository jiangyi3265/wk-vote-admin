import request from '@/utils/request'

// 查询候选人列表
export function listCandidate(query) {
  return request({ url: '/vote/candidate/list', method: 'get', params: query })
}

// 查询候选人详细
export function getCandidate(candidateId) {
  return request({ url: '/vote/candidate/' + candidateId, method: 'get' })
}

// 新增候选人
export function addCandidate(data) {
  return request({ url: '/vote/candidate', method: 'post', data: data })
}

// 修改候选人
export function updateCandidate(data) {
  return request({ url: '/vote/candidate', method: 'put', data: data })
}

// 删除候选人
export function delCandidate(candidateId) {
  return request({ url: '/vote/candidate/' + candidateId, method: 'delete' })
}
