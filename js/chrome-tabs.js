(function(){
  const isNodeContext = typeof module !== 'undefined' && typeof module.exports !== 'undefined'
  if (isNodeContext) {
    Draggabilly = require('draggabilly')
  }

  const tabTemplate = `
    <div class="chrome-tab">
      <div class="chrome-tab-dividers"></div>
      <div class="chrome-tab-background">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg"> <defs> <symbol id="chrome-tab-geometry-left" viewBox="0 0 214 34" > <path d="M17 0h197v34H0c5 0 9-3 9-8V8c0-5 3-8 8-8z"/> </symbol> <symbol id="chrome-tab-geometry-right" viewBox="0 0 214 34"> <use xlink:href="#chrome-tab-geometry-left"/> </symbol> <clipPath id="crop"> <rect class="mask" width="100%" height="100%" x="0"/> </clipPath> </defs> <svg width="50%" height="100%"> <use xlink:href="#chrome-tab-geometry-left" width="214" height="34" class="chrome-tab-background"/> </svg> <g transform="scale(-1, 1)"> <svg width="50%" height="100%" x="-100%" y="0"> <use xlink:href="#chrome-tab-geometry-right" width="214" height="34" class="chrome-tab-background"/> </svg> </g> </svg>
      </div>
      <div class="chrome-tab-drag-handle"></div>
      <div class="chrome-tab-favicon"></div>
      <div class="chrome-tab-title"></div>
      <div class="chrome-tab-close"></div>
    </div>
  `

  const TAB_OVERLAP_DISTANCE = 19

  const defaultTapProperties = {
    title: 'New tab',
    favicon: false
  }

  let instanceId = 0

  class ChromeTabs {
    constructor() {
      this.draggabillyInstances = []
    }

    init(el, options) {
      this.el = el
      this.options = options

      this.instanceId = instanceId
      this.el.setAttribute('data-chrome-tabs-instance-id', this.instanceId)
      instanceId += 1

      this.setupStyleEl()
      this.setupEvents()
      this.layoutTabs()
      this.setupDraggabilly()
    }

    emit(eventName, data) {
      this.el.dispatchEvent(new CustomEvent(eventName, { detail: data }))
    }

    setupStyleEl() {
      this.animationStyleEl = document.createElement('style')
      this.el.appendChild(this.animationStyleEl)
    }

    setupEvents() {
      window.addEventListener('resize', event => this.layoutTabs())

      this.el.addEventListener('dblclick', event => {
        if ([this.el, this.tabContentEl].includes(event.target)) this.addTab()
      })

      this.el.addEventListener('click', ({target}) => {
        if (target.classList.contains('chrome-tab-close')) this.removeTab(target.parentNode)
      })

      this.el.addEventListener('mousedown', ({target}) => {
        if (target.classList.contains('chrome-tab-close')) return
        if (target.classList.contains('chrome-tab')) {
          this.setCurrentTab(target)
        } else if (target.parentNode.classList.contains('chrome-tab')) {
          this.setCurrentTab(target.parentNode)
        }
      })
    }

    get tabEls() {
      return Array.prototype.slice.call(this.el.querySelectorAll('.chrome-tab'))
    }

    get tabContentEl() {
      return this.el.querySelector('.chrome-tabs-content')
    }

    get tabWidth() {
      const tabsContentWidth = this.tabContentEl.clientWidth - TAB_OVERLAP_DISTANCE
      const width = (tabsContentWidth / this.tabEls.length) + TAB_OVERLAP_DISTANCE
      return Math.max(this.options.minWidth, Math.min(this.options.maxWidth, width))
    }

    get tabEffectiveWidth() {
      return this.tabWidth - TAB_OVERLAP_DISTANCE
    }

    get tabPositions() {
      const tabEffectiveWidth = this.tabEffectiveWidth
      let left = 0
      let positions = []

      this.tabEls.forEach((tabEl, i) => {
        positions.push(left)
        left += tabEffectiveWidth
      })
      return positions
    }

    layoutTabs() {
      const tabWidth = this.tabWidth

      this.cleanUpPreviouslyDraggedTabs()
      this.tabEls.forEach((tabEl) => tabEl.style.width = tabWidth + 'px')
      requestAnimationFrame(() => {
        let styleHTML = ''
        this.tabPositions.forEach((left, i) => {
          styleHTML += `
            .chrome-tabs[data-chrome-tabs-instance-id="${ this.instanceId }"] .chrome-tab:nth-child(${ i + 1 }) {
              transform: translate3d(${ left }px, 0, 0)
            }
          `
        })
        this.animationStyleEl.innerHTML = styleHTML
      })
    }

    createNewTabEl() {
      const div = document.createElement('div')
      div.innerHTML = tabTemplate
      return div.firstElementChild
    }

    addTab(tabProperties) {
      const tabEl = this.createNewTabEl()

      tabEl.classList.add('chrome-tab-just-added')
      setTimeout(() => tabEl.classList.remove('chrome-tab-just-added'), 500)

      tabProperties = Object.assign({}, defaultTapProperties, tabProperties)
      this.tabContentEl.appendChild(tabEl)
      this.updateTab(tabEl, tabProperties)
      this.emit('tabAdd', { tabEl })
      this.setCurrentTab(tabEl)
      this.layoutTabs()
      this.setupDraggabilly()
    }

    setCurrentTab(tabEl) {
      const currentTab = this.el.querySelector('.chrome-tab-current')
      if (currentTab) currentTab.classList.remove('chrome-tab-current')
      tabEl.classList.add('chrome-tab-current')
      this.emit('activeTabChange', { tabEl })
    }

    removeTab(tabEl) {
      if (tabEl.classList.contains('chrome-tab-current')) {
        if (tabEl.nextElementSibling) {
          this.setCurrentTab(tabEl.nextElementSibling)
        } else if (tabEl.previousElementSibling) {
          this.setCurrentTab(tabEl.previousElementSibling)
        }
      }
      tabEl.parentNode.removeChild(tabEl)
      this.emit('tabRemove', { tabEl })
      this.layoutTabs()
      this.setupDraggabilly()
    }

    updateTab(tabEl, tabProperties) {
      tabEl.querySelector('.chrome-tab-title').textContent = tabProperties.title

      const faviconEl = tabEl.querySelector('.chrome-tab-favicon')
      if (tabProperties.favicon) {
        faviconEl.style.backgroundImage = `url('${tabProperties.favicon}')`
      } else {
        faviconEl.remove()
      }
    }

    cleanUpPreviouslyDraggedTabs() {
      this.tabEls.forEach((tabEl) => tabEl.classList.remove('chrome-tab-just-dragged'))
    }

    setupDraggabilly() {
      const tabEls = this.tabEls
      const tabEffectiveWidth = this.tabEffectiveWidth
      const tabPositions = this.tabPositions

      this.draggabillyInstances.forEach(draggabillyInstance => draggabillyInstance.destroy())

      tabEls.forEach((tabEl, originalIndex) => {
        const originalTabPositionX = tabPositions[originalIndex]
        const draggabillyInstance = new Draggabilly(tabEl, {
          axis: 'x',
          handle: '.chrome-tab-drag-handle',
          containment: this.tabContentEl
        })

        this.draggabillyInstances.push(draggabillyInstance)

        draggabillyInstance.on('dragStart', () => {
          this.cleanUpPreviouslyDraggedTabs()
          tabEl.classList.add('chrome-tab-currently-dragged')
          this.el.classList.add('chrome-tabs-sorting')
        })

        draggabillyInstance.on('dragEnd', () => {
          const finalTranslateX = parseFloat(tabEl.style.left, 10)
          tabEl.style.transform = `translate3d(0, 0, 0)`

          // Animate dragged tab back into its place
          requestAnimationFrame(() => {
            tabEl.style.left = '0'
            tabEl.style.transform = `translate3d(${ finalTranslateX }px, 0, 0)`

            requestAnimationFrame(() => {
              tabEl.classList.remove('chrome-tab-currently-dragged')
              this.el.classList.remove('chrome-tabs-sorting')

              tabEl.classList.add('chrome-tab-just-dragged')

              requestAnimationFrame(() => {
                tabEl.style.transform = ''

                this.setupDraggabilly()
              })
            })
          })
        })

        draggabillyInstance.on('dragMove', (event, pointer, moveVector) => {
          // Current index be computed within the event since it can change during the dragMove
          const tabEls = this.tabEls
          const currentIndex = tabEls.indexOf(tabEl)

          const currentTabPositionX = originalTabPositionX + moveVector.x
          const destinationIndex = Math.max(0, Math.min(tabEls.length, Math.floor((currentTabPositionX + (tabEffectiveWidth / 2)) / tabEffectiveWidth)))

          if (currentIndex !== destinationIndex) {
            this.animateTabMove(tabEl, currentIndex, destinationIndex)
          }
        })
      })
    }

    animateTabMove(tabEl, originIndex, destinationIndex) {
      if (destinationIndex < originIndex) {
        tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex])
      } else {
        tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1])
      }
    }
  }

  if (isNodeContext) {
    module.exports = ChromeTabs
  } else {
    window.ChromeTabs = ChromeTabs
  }
})()
