$ = jQuery

if document.body.style['-webkit-mask-repeat'] isnt undefined
    $('html').addClass('cssmasks')
else
    $('html').addClass('no-cssmasks')

tabTemplate = '''
    <div class="chrome-tab">
        <div class="chrome-tab-favicon"></div>
        <div class="chrome-tab-title"></div>
        <div class="chrome-tab-close"></div>
        <div class="chrome-tab-curves">
            <div class="chrome-tab-curve-left-shadow2"></div>
            <div class="chrome-tab-curve-left-shadow1"></div>
            <div class="chrome-tab-curve-left"></div>
            <div class="chrome-tab-curve-right-shadow2"></div>
            <div class="chrome-tab-curve-right-shadow1"></div>
            <div class="chrome-tab-curve-right"></div>
        </div>
    </div>
'''

defaultNewTabData =
    title: 'New Tab'
    favicon: ''
    data: {}

chromeTabs =

    init: (options) ->
        $.extend options.$shell.data(), options
        options.$shell
            .find('.chrome-tab').each ->
                $(@).data().tabData = { data: {} }

        render = ->
            chromeTabs.render options.$shell

        $(window).resize render
        render()

    render: ($shell) ->
        chromeTabs.fixTabSizes $shell
        chromeTabs.fixZIndexes $shell
        chromeTabs.setupEvents $shell
        chromeTabs.setupSortable $shell
        $shell.trigger('chromeTabRender')

    setupSortable: ($shell) ->
        $tabs = $shell.find('.chrome-tabs')

        $tabs.sortable
            axis: 'x'
            tolerance: 'pointer'
            start: (e, ui) ->
                chromeTabs.fixZIndexes $shell
                if not $(ui.item).hasClass('chrome-tab-current')
                    $tabs.sortable('option', 'zIndex',  $(ui.item).data().zIndex)
                else
                    $tabs.sortable('option', 'zIndex',  $tabs.length + 40)
            stop: (e, ui) -> chromeTabs.setCurrentTab $shell, $(ui.item)

    fixTabSizes: ($shell) ->
        $tabs = $shell.find('.chrome-tab')
        margin = (parseInt($tabs.first().css('marginLeft'), 10) + parseInt($tabs.first().css('marginRight'), 10)) or 0
        width = $shell.width() - 50
        width = (width / $tabs.length) - margin
        width = Math.max($shell.data().minWidth, Math.min($shell.data().maxWidth, width))
        $tabs.css width: width

    fixZIndexes: ($shell) ->
        $tabs = $shell.find('.chrome-tab')
        $tabs.each (i) ->
            $tab = $ @
            zIndex = $tabs.length - i
            zIndex = $tabs.length + 40 if $tab.hasClass('chrome-tab-current')
            $tab.css zIndex: zIndex
            $tab.data zIndex: zIndex

    setupEvents: ($shell) ->
        $shell.unbind('dblclick').bind 'dblclick', ->
            chromeTabs.addNewTab $shell

        $shell.find('.chrome-tab').each ->
            $tab = $ @

            $tab.unbind('click').click ->
                chromeTabs.setCurrentTab $shell, $tab

            $tab.find('.chrome-tab-close').unbind('click').click ->
                chromeTabs.closeTab $shell, $tab

    addNewTab: ($shell, newTabData) ->
        $newTab = $ tabTemplate
        $shell.find('.chrome-tabs').append $newTab
        tabData = $.extend true, {}, defaultNewTabData, newTabData
        chromeTabs.updateTab $shell, $newTab, tabData
        chromeTabs.setCurrentTab $shell, $newTab

    setCurrentTab: ($shell, $tab) ->
        $shell.find('.chrome-tab-current').removeClass('chrome-tab-current')
        $tab.addClass('chrome-tab-current')
        chromeTabs.render $shell

    closeTab: ($shell, $tab) ->
        if $tab.hasClass('chrome-tab-current') and $tab.prev().length
            chromeTabs.setCurrentTab $shell, $tab.prev()
        $tab.remove()
        chromeTabs.render $shell

    updateTab: ($shell, $tab, tabData) ->
        $tab.find('.chrome-tab-title').html tabData.title
        $tab.find('.chrome-tab-favicon').css backgroundImage: "url('#{tabData.favicon}')"
        $tab.data().tabData = tabData

window.chromeTabs = chromeTabs