> 参考：[百度编辑器接入秀米](https://ent.xiumi.us/ue/)

#### 1、下载百度编辑器插件【1.4.3.3-utf8-php】，放到静态资源文件夹 static 中

![image](/img/Snipaste_2020-03-20_15-31-07.png)



#### 2、index.html引入百度编辑器

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="referrer" content="never">
  <title></title>
</head>

<body>
  <div id="app"></div>
  <!-- built files will be auto injected -->
  <!-- 配置文件 -->
  <script type="text/javascript" src="/static/ue/ueditor.config.js"></script>
  <!-- 编辑器源码文件 -->
  <script type="text/javascript" src="/static/ue/ueditor.all.min.js"></script>
  <!--建议手动加在语言，避免在ie下有时因为加载语言失败导致编辑器加载失败-->
  <!--这里加载的语言文件会覆盖你在配置项目里添加的语言类型，比如你在配置项目里配置的是英文，这里加载的中文，那最后就是中文-->
  <script type="text/javascript" charset="utf-8" src="/static/ue/lang/zh-cn/zh-cn.js">
  </script>
</body>

</html>

```



#### 3、新建 UEditor.vue 组件，并处理数据绑定

```vue
<template>
  <div class="u_editor">
    <div class="editor_wrap">
      <script id="editor"
              type="text/plain"
              name="content"
              style="width:100%;height:81.5%"></script>
    </div>
  </div>
</template>
<script>
export default {
  name: 'UEditor',
  props: {
    value: String
  },
  data () {
    return {
      ue: null,
      content: ''
    }
  },
  watch: {
    value: {
      handler (val) {
        this.content = val
        if (this.ue && this.ue.isReady) {
          this.ue.setContent(this.value)
        }
      },
      immediate: true
    },
    content (val) {
      this.$emit('input', val)
    }
  },
  mounted () {
    this.ue = window.UE.getEditor('editor')
    this.ue.addListener('ready', () => {
      this.ue.setContent(this.value)
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
```



#### 4、修改UEditor图片上传、多图上传、视频上传功能

本例中不采用UEditor的PHP上传功能，通过修改UEditor源码实现七牛上传功能

<u>**注意：本例的修改都基于未压缩版，注意引入资源文件**</u>

##### 1）配置UEditor配置项：传入七牛类、七牛云获取token方法以及配置上传所需配置项

```vue
<script>
import * as Qiniu from 'qiniu-js'

export default {
  name: 'UEditor',
  // ...
  mounted () {
    this.ue = window.UE.getEditor('editor', {
      Qiniu,// 传入Qiniu类
      autoHeightEnabled: false,
      imageActionName: true, // 允许单张图片上传
      catchRemoteImageEnable: true, // 设置是否抓取远程图片
      catcherFieldName: 'catcherField',
      catcherUrlPrefix: 'http://qn.yuemia.com/',
      imageUrlPrefix: 'http://qn.yuemia.com/', // 图片域名，统一采用七牛存储
      imageAllowFiles: ['.png', '.jpg', '.gif'], // 上传图片类型
      videoUrlPrefix: 'http://qn.yuemia.com/', // 视频域名
      videoAllowFiles: ['.mp4'], // 视频类型
      /**
       * @method getToken 获取七牛云token
       * @param {key,cb} key：文件名，cb：回调函数【token获取成功后传回】
       * @for Qiniu.upload
       */
      getToken: (key, cb) => {
        axios.get('apiUrl?key=' + key).then(rsp => {
          if (cb && typeof cb === 'function') {
            cb(rsp.data.token)
          }
        })
      }
    })
	// ...
  }
}
</script>
```

##### 2）注释UEditor检查后端是否配置代码

* 单张图片上传处理（ueditor.all.js）

  ![image](/img/Snipaste_2020-03-20_16-18-33.png)

* 图片对话框中图片上传处理（/dialogs/imge/image.js）

  ![image](/img/Snipaste_2020-03-20_16-29-13.png)

* 视频对话框中视频上传处理（/dialogs/video/video.js）

  ![image](/img/Snipaste_2020-03-20_16-30-37.png)

##### 5）重写上传功能

 * 单张图片上传（ueditor.all.js）， 注释下面代码

   ![image](/img/Snipaste_2020-03-20_16-39-08.png)

   然后插入下面代码

   ```js
   var Qiniu = me.getOpt('Qiniu')
   var getToken = me.getOpt('getToken')
   
   var file = input.files[0]
   var timeStamp = getTimeStamp()
   
   var type = '.' + (file.type.split('/')[1] || '')
   var key = 'ueditor_' + timeStamp + type
   
   getToken(key, function (token) {
       var observable = Qiniu.upload(file, key, token)
   
       observable.subscribe({
           next (res) {},
           error (e) {
               showErrorLoader(me.getLang('simpleupload.loadError'))
           },
           complete (res) {
               link = me.options.imageUrlPrefix + key
   
               loader = me.document.getElementById(loadingId)
               loader.setAttribute('src', link)
               loader.setAttribute('_src', link)
               loader.setAttribute('title', file.name)
               loader.setAttribute('alt', file.name)
               loader.removeAttribute('id')
               domUtils.removeClasses(loader, 'loadingclass')
           }
       })
   })
   
   function getTimeStamp () {
       let now = new Date()
       let Y = now.getFullYear()
       let M = '0' + (now.getMonth() + 1)
       let D = '0' + now.getDate()
       let h = '0' + now.getHours()
       let m = '0' + now.getMinutes()
       let s = '0' + now.getSeconds()
       let ms = '000' + now.getMilliseconds()
       return (
           Y +
           M.substr(-2) +
           D.substr(-2) +
           h.substr(-2) +
           m.substr(-2) +
           s.substr(-2) +
           ms.substr(-4)
       )
   }
   ```

   

 * 图片对话框多张图片上传，创建WebUploader实例时传入（/dialogs/image/image.js）

   ![](/img/Snipaste_2020-03-20_16-53-20.png)

   ```js
   uploader = _this.uploader = WebUploader.create({
           Qiniu: editor.getOpt('Qiniu'),
           getToken: editor.getOpt('getToken'),
           sendAsBinary: true,
           //...
   })
   ```

   视频对话框视频上传代码修改（/dialogs/video/video.js）

   ![image](/img/Snipaste_2020-03-20_17-11-20.png)

   ```js
   uploader = _this.uploader = WebUploader.create({
       accept: {    
           title: 'Video',
           extensions: acceptExtensions,
           mimeTypes: 'video/*'
       },
       Qiniu: editor.getOpt('Qiniu'),
       getToken: editor.getOpt('getToken'),
       sendAsBinary: true
       // ...
   })
   ```

   修改上传功能代码（/third-party/webuploader/webuploader.js）

   ![image](/img/Snipaste_2020-03-20_17-05-25.png)

   ```js
    // xhr.send(binary)
   var Qiniu = opts.Qiniu
   var getToken = opts.getToken
   
   var file = binary
   var timeStamp = getTimeStamp()
   
   var type = '.' + (file.type.split('/')[1] || '')
   var key = 'ueditor_' + timeStamp + type
   
   getToken(key, function (token) {
       var observable = Qiniu.upload(file, key, token)
   
       // observable.subscribe(next, error, complete)
       observable.subscribe({
           next (res) {
               me.trigger('progress', res.total.percent / 100)
           },
           error (e) {
               // console.log(e)
               me.trigger('error', 'server')
           },
           complete (res) {
               me._response = JSON.stringify({
                   state: 'SUCCESS',
                   url: key,
                   type,
                   title: key,
                   size: file.size
               })
               me.trigger('load')
           }
       })
   })
   function getTimeStamp () {
       let now = new Date()
       let Y = now.getFullYear()
       let M = '0' + (now.getMonth() + 1)
       let D = '0' + now.getDate()
       let h = '0' + now.getHours()
       let m = '0' + now.getMinutes()
       let s = '0' + now.getSeconds()
       let ms = '000' + now.getMilliseconds()
       return (
           Y +
           M.substr(-2) +
           D.substr(-2) +
           h.substr(-2) +
           m.substr(-2) +
           s.substr(-2) +
           ms.substr(-4)
       )
   }
   ```

 * 重写远程图片转存功能

   ![image](/img/Snipaste_2020-03-20_17-15-23.png)

   ```js
   // opt[catcherFieldName] = imgs
   // ajax.request(url, opt)
   var imgFile = new Array(imgs.length)
   var count = 0
   for (var i = 0; i < imgs.length; i++) {
       var img = new Image()
       img.setAttribute('crossOrigin', 'Anonymous')
       img.src = imgs[i]
       var canvas = document.createElement('canvas')
       var ctx = canvas.getContext('2d')
       loadImg(img, i)
   }
   function loadImg (img, i) {
       img.onload = function () {
           canvas.width = img.width
           canvas.height = img.height
           ctx.drawImage(img, 0, 0, img.width, img.height)
   
           var dataURL = ''
           if (~img.src.indexOf('.webp')) {
               dataURL = canvas.toDataURL('image/jpeg')
           } else {
               dataURL = canvas.toDataURL()
           }
           var timeStamp = getTimeStamp()
           var name = 'ueditor_' + timeStamp
   
           var file = dataURLtoFile(dataURL, name)
   
           var Qiniu = me.getOpt('Qiniu')
   
           var getToken = me.getOpt('getToken')
   
           getToken(file.name, function (token) {
               var observable = Qiniu.upload(file, file.name, token)
   
               observable.subscribe({
                   next (res) {},
                   error (e) {
                       showErrorLoader(me.getLang('simpleupload.loadError'))
                   },
                   complete (res) {
                       ++count
                       imgFile[i] = {
                           state: 'SUCCESS',
                           source: imgs[i],
                           url: res.key
                       }
   					// callbacks['success']({state:'SUCCESS',list:[state:'SUCCESS',url:'']})
                       if (count === imgs.length) {
                           callbacks['success']({
                               state: 'SUCCESS',
                               list: imgFile
                           })
                       }
                   }
               })
           })
       }
   }
   function dataURLtoFile (dataurl, filename) {
       /* eslint-disable */
       var arr = dataurl.split(','),
           mime = arr[0].match(/:(.*?);/)[1],
           bstr = atob(arr[1]),
           n = bstr.length,
           u8arr = new Uint8Array(n)
       /* eslint-disable */
       while (n--) {
           u8arr[n] = bstr.charCodeAt(n)
       }
       var type = '.' + (mime.split('/')[1] || '')
   
       return new File([u8arr], filename + type, { type: mime })
   }
   function getTimeStamp () {
       let now = new Date()
       let Y = now.getFullYear()
       let M = '0' + (now.getMonth() + 1)
       let D = '0' + now.getDate()
       let h = '0' + now.getHours()
       let m = '0' + now.getMinutes()
       let s = '0' + now.getSeconds()
       let ms = '000' + now.getMilliseconds()
       return (
           Y +
           M.substr(-2) +
           D.substr(-2) +
           h.substr(-2) +
           m.substr(-2) +
           s.substr(-2) +
           ms.substr(-4)
       )
   }
   ```



#### 5、接入秀米

* 下载文件 [xiumi-ue-dialog-v5.js](https://ent.xiumi.us/ue/xiumi-ue-dialog-v5.js) 和 [xiumi-ue-v5.css](https://ent.xiumi.us/ue/xiumi-ue-v5.css) 并在代码中引入

  ![image](/img/Snipaste_2020-03-20_15-46-41.png)

* 下载文件 [xiumi-ue-dialog-v5.html](https://ent.xiumi.us/ue/xiumi-ue-dialog-v5.html) 和  [internal.js](https://ent.xiumi.us/ue/dialogs/internal.js)，放置在编辑器文件夹中，并修改xiumi-ue-dialog-v5.js的内容：

  ```js
  iframeUrl: '/static/ue/xiumi-ue-dialog-v5.html' // 将此处的值改为实际的文件路径
  ```

* 修改UEditor的配置（ueditor.config.js），将其中的“xxs过滤白名单”加上

  ```js
  section:['class', 'style'],
  ```

* 完成接入

#### 6、[DEMO](http://test.angel.yuemia.com/client/editor)

