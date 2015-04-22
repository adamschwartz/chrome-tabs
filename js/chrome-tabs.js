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
    init: function(options) {
      var render;
      $.extend(options.$shell.data(), options);
      options.$shell.find('.chrome-tab').each(function() {
        return $(this).data().tabData = {
          data: {}
        };
      });
      render = function() {
        return chromeTabs.render(options.$shell);
      };
      $(window).resize(render);
      return render();
    },
    render: function($shell) {
      chromeTabs.fixTabSizes($shell);
      chromeTabs.fixZIndexes($shell);
      chromeTabs.setupEvents($shell);
      chromeTabs.setupSortable($shell);
      return $shell.trigger('chromeTabRender');
    },
    setupSortable: function($shell) {
      var $tabs;
      $tabs = $shell.find('.chrome-tabs');
      return $tabs.sortable({
        axis: 'x',
        tolerance: 'pointer',
        start: function(e, ui) {
          chromeTabs.fixZIndexes($shell);
          if (!$(ui.item).hasClass('chrome-tab-current')) {
            return $tabs.sortable('option', 'zIndex', $(ui.item).data().zIndex);
          } else {
            return $tabs.sortable('option', 'zIndex', $tabs.length + 40);
          }
        },
        stop: function(e, ui) {
          return chromeTabs.setCurrentTab($shell, $(ui.item));
        }
      });
    },
    fixTabSizes: function($shell) {
      var $tabs, margin, width;
      $tabs = $shell.find('.chrome-tab');
      margin = (parseInt($tabs.first().css('marginLeft'), 10) + parseInt($tabs.first().css('marginRight'), 10)) || 0;
      width = $shell.width() - 50;
      width = (width / $tabs.length) - margin;
      width = Math.max($shell.data().minWidth, Math.min($shell.data().maxWidth, width));
      return $tabs.css({
        width: width
      });
    },
    fixZIndexes: function($shell) {
      var $tabs;
      $tabs = $shell.find('.chrome-tab');
      return $tabs.each(function(i) {
        var $tab, zIndex;
        $tab = $(this);
        zIndex = $tabs.length - i;
        if ($tab.hasClass('chrome-tab-current')) {
          zIndex = $tabs.length + 40;
        }
        $tab.css({
          zIndex: zIndex
        });
        return $tab.data({
          zIndex: zIndex
        });
      });
    },
    setupEvents: function($shell) {
      $shell.unbind('dblclick').bind('dblclick', function() {
        return chromeTabs.addNewTab($shell);
      });
      $shell.unbind('mouseup').bind('mouseup', function(e) {
        if(e.which == 2 && e.target.className != 'chrome-tab-title') 
        	return chromeTabs.addNewTab($shell);
      });
      return $shell.find('.chrome-tab').each(function() {
        var $tab;
        $tab = $(this);
        $tab.unbind('click').click(function() {
          return chromeTabs.setCurrentTab($shell, $tab);
        });
        $tab.unbind('mouseup').mouseup(function(e) {
          if(e.which == 2) return chromeTabs.closeTab($shell, $tab);
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
      if ($tab.hasClass('chrome-tab-current')) {
        if ($tab.prev().length) {
          chromeTabs.setCurrentTab($shell, $tab.prev());
        } else if ($tab.next().length) {
          chromeTabs.setCurrentTab($shell, $tab.next());
        }
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
