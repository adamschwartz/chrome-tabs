(function() {
  var $, chromeTabs, defaultNewTabData, tabTemplate;
  $ = jQuery;
  if (document.body.style['-webkit-mask-repeat'] !== void 0) {
    $('html').addClass('cssmasks');
  } else {
    $('html').addClass('no-cssmasks');
  }
  tabTemplate = '<div class="chrome-tab">\n    <div class="chrome-tab-favicon"></div>\n    <div class="chrome-tab-title"></div>\n    <div class="chrome-tab-close"></div>\n    <div class="chrome-tab-curves">\n        <div class="chrome-tab-curve-left-shadow2"></div>\n        <div class="chrome-tab-curve-left-shadow1"></div>\n        <div class="chrome-tab-curve-left"></div>\n        <div class="chrome-tab-curve-right-shadow2"></div>\n        <div class="chrome-tab-curve-right-shadow1"></div>\n        <div class="chrome-tab-curve-right"></div>\n    </div>\n</div>';
  defaultNewTabData = {
    title: 'New Tab',
    favicon: '',
    data: {}
  };
  chromeTabs = {
    init: function($shell) {
      $shell.find('.chrome-tab').each(function() {
        return $(this).data().tabData = {
          data: {}
        };
      });
      chromeTabs.render($shell);
      return $(window).resize(function() {
        return chromeTabs.render($shell);
      });
    },
    render: function($shell) {
      chromeTabs.fixTabSizes($shell);
      chromeTabs.fixZIndexes($shell);
      chromeTabs.setupEvents($shell);
      return $shell.trigger('chromeTabRender');
    },
    fixTabSizes: function($shell) {
      var $tabs, margin, width;
      width = $shell.width() - 50;
      $tabs = $shell.find('.chrome-tab');
      margin = (parseInt($tabs.first().css('marginLeft'), 10) + parseInt($tabs.first().css('marginRight'), 10)) || 0;
      return $tabs.css({
        width: (width / $tabs.length) - margin
      });
    },
    fixZIndexes: function($shell) {
      var $tabs;
      $tabs = $shell.find('.chrome-tab');
      return $tabs.each(function(i) {
        var $tab, zIndex;
        $tab = $(this);
        zIndex = $tabs.length - i + 1;
        if ($tab.hasClass('chrome-tab-current')) {
          zIndex = $tabs.length + 40;
        }
        return $tab.css({
          zIndex: zIndex
        });
      });
    },
    setupEvents: function($shell) {
      $shell.unbind('dblclick').bind('dblclick', function() {
        return chromeTabs.addNewTab($shell);
      });
      return $shell.find('.chrome-tab').each(function() {
        var $tab;
        $tab = $(this);
        $tab.unbind('click').click(function() {
          return chromeTabs.setCurrentTab($shell, $tab);
        });
        return $tab.find('.chrome-tab-close').unbind('click').click(function() {
          return chromeTabs.closeTab($shell, $tab);
        });
      });
    },
    addNewTab: function($shell, newTabData) {
      var $newTab, tabData;
      $newTab = $(tabTemplate);
      $shell.find('.chrome-tabs').append($newTab);
      tabData = $.extend(true, {}, defaultNewTabData, newTabData);
      chromeTabs.updateTab($shell, $newTab, tabData);
      return chromeTabs.setCurrentTab($shell, $newTab);
    },
    setCurrentTab: function($shell, $tab) {
      $shell.find('.chrome-tab-current').removeClass('chrome-tab-current');
      $tab.addClass('chrome-tab-current');
      return chromeTabs.render($shell);
    },
    closeTab: function($shell, $tab) {
      if ($tab.hasClass('chrome-tab-current') && $tab.prev().length) {
        chromeTabs.setCurrentTab($shell, $tab.prev());
      }
      $tab.remove();
      return chromeTabs.render($shell);
    },
    updateTab: function($shell, $tab, tabData) {
      $tab.find('.chrome-tab-title').html(tabData.title);
      $tab.find('.chrome-tab-favicon').css({
        backgroundImage: "url('" + tabData.favicon + "')"
      });
      return $tab.data().tabData = tabData;
    }
  };
  window.chromeTabs = chromeTabs;
}).call(this);
