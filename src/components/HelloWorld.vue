<template>
  <div class="hello">
    <h1>轩轩五子棋 V2</h1>
    <a href="javascript:;" class="weui-btn weui-btn_primary">页面主操作 Normal</a>

    <div class="weui-cells__title">设置</div>
    <div class="weui-cells">
        <div class="weui-cell weui-cell_select weui-cell_select-after">
            <div class="weui-cell__hd">
                <label for="" class="weui-label">思考深度</label>
            </div>
            <div class="weui-cell__bd">
                <select class="weui-select" name="select2">
                    <option value="1">6~8 (简单)</option>
                    <option value="2">8~10 (普通)</option>
                    <option value="3">10~12 (困难)</option>
                </select>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  components: {
  },
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '../variables';
h1 {
}
</style>
