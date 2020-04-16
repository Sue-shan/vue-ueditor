/**
 * Created by shunchen_yang on 16/10/25.
 */
UE.registerUI('dialog', function (editor, uiName) {
  var btn = new UE.ui.Button({
    name: 'xiumi-connect',
    title: '秀米',
    onclick: function () {
      var dialog = new UE.ui.Dialog({
        iframeUrl: '/static/ue/xiumi-ue-dialog-v5.html',
        editor: editor,
        name: 'xiumi-connect',
        title: '秀米图文消息助手',
        cssRules:
          'width: ' +
          (window.innerWidth - 60) +
          'px;' +
          'height: ' +
          (window.innerHeight - 60) +
          'px;'
      })
      dialog.render()
      dialog.open()
    }
  })
  editor.addListener('selectionchange', function (type, causeByUi, uiReady) {
    var state = editor.queryCommandState('xiumi-connect')
    if (state == -1) {
      btn.setDisabled(true)
      btn.setChecked(false)
    } else {
      if (!uiReady) {
        btn.setDisabled(false)
        btn.setChecked(state)
      }
    }
  })

  return btn
})
