<template>
  <div class="u_editor">
    <div class="editor_wrap">
      <script id="editor"
              type="text/plain"
              name="content"
              style="width:100%;height:81.5%"></script>
    </div>
    <div class="svg_wrap"
         @click.stop.prevent="showPreview = !showPreview">
      <svg-icon :className="showPreview?'hide':'show'" />
    </div>
    <div class="viewer rich_content"
         v-show="showPreview"
         v-html="content"></div>
  </div>
</template>
<script>
import * as Qiniu from 'qiniu-js'
import axios from 'axios'

export default {
  name: 'UEditor',
  props: {
    value: String,
    disabled: Boolean
  },
  data () {
    return {
      ue: null,
      content: '',
      showPreview: false
    }
  },
  watch: {
    value: {
      handler (val) {
        this.content = val
  		// 修复富文本编辑器数据绑定，只需初始化数据就可以，后面不用实时绑定
        if (this.ue && this.ue.isReady && !this.ue.hasContents()) {
          this.ue.setContent(this.value)
        }
      },
      immediate: true
    },
    content (val) {
      this.$emit('input', val)
    },
    disabled (val) {
      this.checkDisabled()
    }
  },
  methods: {
    checkDisabled () {
      if (this.disabled) {
        this.ue.setDisabled('fullscreen')
      } else {
        this.ue.setEnabled()
      }
    }
  },
  mounted () {
    this.ue = window.UE.getEditor('editor', {
      Qiniu,
      autoHeightEnabled: false,
      imageActionName: true, // 允许单张图片上传
      catchRemoteImageEnable: true, // 设置是否抓取远程图片
      catcherFieldName: 'catcherField',
      catcherUrlPrefix: 'http://qn.yuemia.com/',
      imageUrlPrefix: 'http://qn.yuemia.com/',
      imageAllowFiles: ['.png', '.jpg', '.gif'],
      videoUrlPrefix: 'http://qn.yuemia.com/',
      videoAllowFiles: ['.mp4'],
      getToken: (key, cb) => {
        axios.get('/api/angel/qiniutoken/?key=' + key).then(rsp => {
          if (cb && typeof cb === 'function') {
            cb(rsp.data.token)
          }
        })
      }
    })
    this.ue.addListener('ready', () => {
      this.ue.setContent(this.value)
      this.checkDisabled()
    })
    this.ue.addListener('contentChange', () => {
      setTimeout(() => {
        this.content = this.ue.getContent()
      })
    })
  },
  destroyed () {
    this.ue.destroy()
  }
}
</script>
<style lang="stylus" scoped>
.u_editor
  position relative
  display flex
  padding-bottom 30px
  .viewer
    position relative
    overflow-x hidden
    overflow-y auto
    box-sizing border-box
    margin-left 15px
    padding 1em
    width 400px
    height 700px
    border 1px solid #d4d4d4
    border-radius 4px
    &::-webkit-scrollbar /* 滚动条整体样式 */
      width 6px /* 高宽分别对应横竖滚动条的尺寸 */
      height 6px
    &::-webkit-scrollbar-thumb /* 滚动条里面小方块 */
      border-radius 3px
      background rgba(144, 147, 153, 0.3)
      // -webkit-box-shadow inset 0 0 5px rgba(0, 0, 0, 0.2)
    &::-webkit-scrollbar-track /* 滚动条里面轨道 */
      // -webkit-box-shadow inset 0 0 5px rgba(0,0,0,0.2)
      // border-radius 10px
      background #fff
  .svg_wrap
    position absolute
    top 30px
    left -10px
    z-index 99
    display flex
    justify-content center
    align-items center
    width 30px
    height 30px
    border-radius 50%
    background-color rgba(0, 0, 0, 0.2)
    cursor pointer
    transform translate(-100%, 0)
.editor_wrap
  flex 1
  max-width 700px
  width 0
  height 700px
</style>
