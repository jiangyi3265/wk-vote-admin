<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="所属活动" prop="activityId">
        <el-select v-model="queryParams.activityId" placeholder="请选择活动" style="width: 240px" @change="handleQuery">
          <el-option v-for="a in activities" :key="a.activityId" :label="a.title" :value="a.activityId" />
        </el-select>
      </el-form-item>
      <el-form-item label="投票人" prop="voterName">
        <el-input v-model="queryParams.voterName" placeholder="请输入投票人姓名" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['vote:record:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="DeleteFilled" @click="handleClear" v-hasPermi="['vote:record:clear']">清空本活动投票</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="记录ID" align="center" prop="recordId" width="90" />
      <el-table-column label="投票人" align="center" prop="voterName" width="160" />
      <el-table-column label="候选人" align="center" prop="candidateName" min-width="140" />
      <el-table-column label="评选维度" align="center" prop="optionName" width="140" />
      <el-table-column label="投票时间" align="center" prop="createTime" width="180">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['vote:record:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="VoteRecord">
import { listRecord, delRecord, clearRecord } from "@/api/vote/record"
import { listActivity } from "@/api/vote/activity"

const { proxy } = getCurrentInstance()

const recordList = ref([])
const activities = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)

const data = reactive({
  queryParams: { pageNum: 1, pageSize: 10, activityId: undefined, voterName: undefined }
})
const { queryParams } = toRefs(data)

function loadActivities() {
  return listActivity({ pageNum: 1, pageSize: 100 }).then(res => {
    activities.value = res.rows
    if (!queryParams.value.activityId && res.rows[0]) queryParams.value.activityId = res.rows[0].activityId
  })
}
function getList() {
  if (!queryParams.value.activityId) { recordList.value = []; total.value = 0; loading.value = false; return }
  loading.value = true
  listRecord(queryParams.value).then(res => { recordList.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { const keep = queryParams.value.activityId; proxy.resetForm("queryRef"); queryParams.value.activityId = keep; handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.recordId); multiple.value = !selection.length }
function handleDelete(row) {
  const _ids = row.recordId || ids.value
  proxy.$modal.confirm('是否确认删除所选投票记录？').then(() => delRecord(_ids))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleClear() {
  if (!queryParams.value.activityId) { proxy.$modal.msgWarning("请先选择活动"); return }
  proxy.$modal.confirm('确认清空该活动的全部投票记录与投票人吗？此操作不可恢复！').then(() => clearRecord(queryParams.value.activityId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已清空") }).catch(() => {})
}

loadActivities().then(getList)
</script>
