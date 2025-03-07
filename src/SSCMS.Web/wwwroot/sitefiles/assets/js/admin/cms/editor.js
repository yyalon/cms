﻿var $url = '/cms/editor/editor';
var $urlInsert = $url + '/actions/insert';
var $urlUpdate = $url + '/actions/update';
var $urlPreview = $url + '/actions/preview';
var $urlCensor = $url + '/actions/censor';
var $urlTags = $url + '/actions/tags';

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1,                   // 月份
    "d+": this.getDate(),                        // 日
    "h+": this.getHours(),                       // 时
    "m+": this.getMinutes(),                     // 分
    "s+": this.getSeconds(),                     // 秒
    "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
    "S": this.getMilliseconds()                  // 毫秒
  };

  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));

  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));

  return fmt;
};

var data = utils.init({
  siteId: utils.getQueryInt('siteId'),
  channelId: utils.getQueryInt('channelId'),
  contentId: utils.getQueryInt('contentId'),
  page: utils.getQueryInt('page'),
  tabName: utils.getQueryString('tabName'),
  reloadChannelId: utils.getQueryInt('reloadChannelId'),
  mainHeight: '',
  isSettings: true,
  sideType: 'first',
  collapseSettings: ['checkedLevel', 'addDate'],
  collapseMore: ['templateId', 'translates'],

  csrfToken: null,
  site: null,
  siteUrl: null,
  channel: null,
  groupNames: null,
  tagNames: null,
  checkedLevels: null,
  isCensorTextEnabled: null,
  siteOptions: null,
  channelOptions: null,
  styles: null,
  templates: null,
  form: null,

  translates: [],
  isPreviewSaving: false,

  dialogCensor: false,
  isCensorSave: false,
  textResult: null
});

var methods = {
  runFormLayerImageUploadText: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runFormLayerImageUploadEditor: function(attributeName, html) {
    this.insertEditor(attributeName, html);
  },

  runMaterialLayerImageSelect: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runFormLayerFileUpload: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runMaterialLayerFileSelect: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runFormLayerVideoUpload: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runMaterialLayerVideoSelect: function(attributeName, no, text) {
    this.insertText(attributeName, no, text);
  },

  runEditorLayerImage: function(attributeName, html) {
    this.insertEditor(attributeName, html);
  },

  insertText: function(attributeName, no, text) {
    var count = this.form[utils.getCountName(attributeName)] || 0;
    if (count <= no) {
      this.form[utils.getCountName(attributeName)] = no;
    }
    this.form[utils.getExtendName(attributeName, no)] = text;
    this.form = _.assign({}, this.form);
  },

  insertEditor: function(attributeName, html) {
    if (!attributeName) attributeName = 'Body';
    if (!html) return;
    utils.getEditor(attributeName).execCommand('insertHTML', html);
  },

  addTranslation: function(targetSiteId, targetChannelId, translateType, summary) {
    this.translates.push({
      siteId: this.siteId,
      channelId: this.channelId,
      targetSiteId: targetSiteId,
      targetChannelId: targetChannelId,
      translateType: translateType,
      summary: summary
    });
  },

  updateGroups: function(res, message) {
    this.groupNames = res.groupNames;
    utils.success(message);
  },

  apiGet: function() {
    var $this = this;

    window.onresize = function() {
      $this.mainHeight = ($(window).height() - 70) + 'px';
    };
    window.onresize();

    $api.get($url, {
      params: {
        siteId: $this.siteId,
        channelId: $this.channelId,
        contentId: $this.contentId
      }
    }).then(function(response) {
      var res = response.data;

      $this.csrfToken = res.csrfToken;

      $this.site = res.site;
      $this.siteUrl = res.siteUrl;
      $this.channel = res.channel;
      $this.groupNames = res.groupNames;
      $this.tagNames = res.tagNames;
      $this.checkedLevels = res.checkedLevels;
      $this.isCensorTextEnabled = res.isCensorTextEnabled;

      $this.siteOptions = res.siteOptions;
      $this.channelOptions = res.channelOptions;

      $this.styles = res.styles;
      $this.templates = res.templates;
      $this.form = _.assign({}, res.content);

      if (!$this.form.addDate) {
        $this.form.addDate = new Date().Format("yyyy-MM-dd hh:mm:ss");
      } else {
        $this.form.addDate = new Date($this.form.addDate).Format("yyyy-MM-dd hh:mm:ss");
      }

      if ($this.form.checked) {
        $this.form.checkedLevel = $this.site.checkContentLevel;
      }
      if ($this.checkedLevels.indexOf($this.form.checkedLevel) === -1) {
        $this.form.checkedLevel = res.checkedLevel;
      }
      if ($this.form.top || $this.form.recommend || $this.form.hot || $this.form.color) {
        $this.collapseSettings.push('attributes');
      }
      if ($this.form.groupNames && $this.form.groupNames.length > 0) {
        $this.collapseSettings.push('groupNames');
      } else {
        $this.form.groupNames = [];
      }
      if ($this.form.tagNames && $this.form.tagNames.length > 0) {
        $this.collapseSettings.push('tagNames');
      } else {
        $this.form.tagNames = [];
      }
      if ($this.form.linkUrl) {
        $this.collapseSettings.push('linkUrl');
      }

      for (var i = 0; i < $this.styles.length; i++) {
        var style = $this.styles[i];
        if (style.inputType === 'CheckBox' || style.inputType === 'SelectMultiple') {
          var value = $this.form[utils.toCamelCase(style.attributeName)];
          if (!Array.isArray(value)) {
            if (!value) {
              $this.form[utils.toCamelCase(style.attributeName)] = [];
            } else {
              $this.form[utils.toCamelCase(style.attributeName)] = utils.toArray(value);
            }
          }
        } else if (style.inputType === 'Image' || style.inputType === 'File' || style.inputType === 'Video') {
          $this.form[utils.getCountName(style.attributeName)] = utils.toInt($this.form[utils.getCountName(style.attributeName)]);
        } else if (style.inputType === 'Text' || style.inputType === 'TextArea' || style.inputType === 'TextEditor') {
          if ($this.contentId === 0) {
            $this.form[utils.toCamelCase(style.attributeName)] = style.defaultValue;
          }
        }
      }

      setTimeout(function () {
        for (var i = 0; i < $this.styles.length; i++) {
          var style = $this.styles[i];
          var attributeName = utils.toCamelCase(style.attributeName);
          if (style.inputType === 'TextEditor') {
            var editor = utils.getEditor(style.attributeName);
            editor.styleIndex = i;
            editor.ready(function () {
              this.addListener("contentChange", function () {
                var style = $this.styles[this.styleIndex];
                $this.form[utils.toCamelCase(style.attributeName)] = this.getContent();
              });
            });
          } else if (style.inputType === 'Date' || style.inputType === 'DateTime') {
            if (!$this.form[attributeName]) {
              $this.form[attributeName] = new Date().Format("yyyy-MM-dd hh:mm:ss");
            } else {
              $this.form[attributeName] = new Date($this.form[attributeName]).Format("yyyy-MM-dd hh:mm:ss");
            }
          }
        }
      }, 100);
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  syncEditors: function () {
    var $this = this;
    if (UE) {
      $.each(UE.instants, function (index, editor) {
        editor.sync();
        var style = $this.styles[editor.styleIndex];
        $this.form[utils.toCamelCase(style.attributeName)] = editor.getContent();
      });
    }
  },

  apiInsert: function() {
    var $this = this;

    utils.loading(this, true);
    $api.csrfPost(this.csrfToken, $urlInsert, {
      siteId: this.siteId,
      channelId: this.channelId,
      contentId: this.contentId,
      content: this.form,
      translates: this.translates
    }).then(function(response) {
      var res = response.data;

      $this.closeAndRedirect(false);
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  apiCensor: function(isSave) {
    this.isCensorSave = isSave;
    var $this = this;

    utils.loading(this, true);
    $api.csrfPost(this.csrfToken, $urlCensor, {
      siteId: this.siteId,
      channelId: this.channelId,
      content: this.form
    }).then(function(response) {
      var res = response.data;

      if (res.success) {
        if (isSave) {
          $this.btnCensorSaveClick();
        } else {
          utils.success('内容审查通过！');
        }
      } else {
        $this.textResult = res.textResult;
        $this.dialogCensor = true;
      }
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  apiTags: function() {
    var $this = this;

    utils.loading(this, true);
    $api.csrfPost(this.csrfToken, $urlTags, {
      siteId: this.siteId,
      channelId: this.channelId,
      content: this.form.body
    }).then(function(response) {
      var res = response.data;

      if (res.tags && res.tags.length > 0) {
        $this.form.tagNames = _.union($this.form.tagNames, res.tags);
        utils.success('成功提取标签！');
      }
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  apiPreview: function() {
    var $this = this;

    utils.loading(this, true);
    $api.csrfPost(this.csrfToken, $urlPreview, {
      siteId: this.siteId,
      channelId: this.channelId,
      contentId: this.contentId,
      content: this.form
    }).then(function(response) {
      var res = response.data;

      $this.isPreviewSaving = false;
      window.open(res.url);
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  apiUpdate: function() {
    var $this = this;

    utils.loading(this, true);
    $api.csrfPost(this.csrfToken, $urlUpdate, {
      siteId: this.siteId,
      channelId: this.channelId,
      contentId: this.contentId,
      content: this.form,
      translates: this.translates
    }).then(function(response) {
      var res = response.data;

      $this.closeAndRedirect(true);
    }).catch(function(error) {
      utils.error(error);
    }).then(function() {
      utils.loading($this, false);
    });
  },

  btnCensorSaveClick: function() {
    if (this.contentId === 0) {
      this.apiInsert();
    } else {
      this.apiUpdate();
    }
  },

  closeAndRedirect: function(isEdit) {
    var tabVue = utils.getTabVue(this.tabName);
    if (tabVue) {
      if (isEdit) {
        tabVue.apiList(this.reloadChannelId > 0 ? this.reloadChannelId : this.channelId, this.page, '内容编辑成功！');
      } else {
        tabVue.apiList(this.channelId, this.page, '内容新增成功！', true);
      }
    }
    utils.removeTab();
    utils.openTab(this.tabName);
  },

  btnLayerClick: function(options) {
    var query = {
      siteId: this.siteId,
      channelId: this.channelId,
      editorAttributeName: 'Body'
    };

    if (options.contentId) {
      query.contentId = options.contentId;
    }
    if (options.attributeName) {
      query.attributeName = options.attributeName;
    }
    if (options.no) {
      query.no = options.no;
    }

    var args = {
      title: options.title,
      url: utils.getCommonUrl(options.name, query)
    };
    if (!options.full) {
      args.width = options.width ? options.width : 700;
      args.height = options.height ? options.height : 500;
    }

    utils.openLayer(args);
  },

  handleTranslationClose: function(summary) {
    this.translates = _.remove(this.translates, function(n) {
      return summary !== n.summary;
    });
  },

  btnSaveClick: function() {
    var $this = this;
    this.syncEditors();
    this.$refs.form.validate(function(valid) {
      if (valid) {
        if ($this.site.isAutoCheckKeywords && $this.isCensorTextEnabled) {
          $this.apiCensor(true);
        } else {
          $this.btnCensorSaveClick();
        }
      } else {
        utils.error('保存失败，请检查表单值是否正确');
      }
    });
  },

  btnCensorClick: function() {
    this.syncEditors();
    this.apiCensor(false);
  },

  btnTagsClick: function() {
    this.syncEditors();
    if (!this.form.body) return;
    this.apiTags();
  },

  btnPreviewClick: function() {
    var $this = this;
    if (this.isPreviewSaving) return;
    this.syncEditors();
    this.$refs.form.validate(function(valid) {
      if (valid) {
        $this.apiPreview();
      } else {
        utils.error('预览失败，请检查表单值是否正确');
      }
    });
  },

  btnCloseClick: function() {
    utils.removeTab();
  },

  btnGroupAddClick: function() {
    utils.openLayer({
      title: '新增内容组',
      url: utils.getCommonUrl('groupContentLayerAdd', {siteId: this.siteId}),
      width: 500,
      height: 300
    });
  },

  btnTranslateAddClick: function() {
    utils.openLayer({
      title: "选择转移栏目",
      url: utils.getCmsUrl('editorLayerTranslate', {
        siteId: this.siteId,
        channelId: this.channelId
      }),
      width: 620,
      height: 400
    });
  },

  btnExtendAddClick: function(style) {
    var no = this.form[utils.getCountName(style.attributeName)] + 1;
    this.form[utils.getCountName(style.attributeName)] = no;
    this.form[utils.getExtendName(style.attributeName, no)] = '';
    this.form = _.assign({}, this.form);
  },

  btnExtendRemoveClick: function(style) {
    var no = this.form[utils.getCountName(style.attributeName)];
    this.form[utils.getCountName(style.attributeName)] = no - 1;
    this.form[utils.getExtendName(style.attributeName, no)] = '';
    this.form = _.assign({}, this.form);
  },

  btnExtendPreviewClick: function(attributeName, no) {
    var count = this.form[utils.getCountName(attributeName)];
    var data = [];
    for (var i = 0; i <= count; i++) {
      var imageUrl = this.form[utils.getExtendName(attributeName, i)];
      imageUrl = utils.getUrl(this.siteUrl, imageUrl);
      data.push({
        "src": imageUrl
      });
    }
    layer.photos({
      photos: {
        "start": no,
        "data": data
      }
      ,anim: 5
    });
  }
};

var $vue = new Vue({
  el: "#main",
  data: data,
  methods: methods,
  created: function() {
    utils.keyPress(this.btnSaveClick, this.btnCloseClick);
    this.apiGet();
  }
});
