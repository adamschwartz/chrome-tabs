(function(){
  const tabTemplate = `
    <div class="chrome-tab">
      <div class="chrome-tab-background">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="topleft" viewBox="0 0 214 29" ><path d="M14.3 0.1L214 0.1 214 29 0 29C0 29 12.2 2.6 13.2 1.1 14.3-0.4 14.3 0.1 14.3 0.1Z"/></symbol><symbol id="topright" viewBox="0 0 214 29"><use xlink:href="#topleft"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="50%" height="100%" transfrom="scale(-1, 1)"><use xlink:href="#topleft" width="214" height="29" class="chrome-tab-background"/><use xlink:href="#topleft" width="214" height="29" class="chrome-tab-shadow"/></svg><g transform="scale(-1, 1)"><svg width="50%" height="100%" x="-100%" y="0"><use xlink:href="#topright" width="214" height="29" class="chrome-tab-background"/><use xlink:href="#topright" width="214" height="29" class="chrome-tab-shadow"/></svg></g></svg>
      </div>
      <div class="chrome-tab-favicon"></div>
      <div class="chrome-tab-title"></div>
      <div class="chrome-tab-close"></div>
    </div>
  `

  defaultTapProperties = {
    title: '',
    favicon: ''
  }

  class ChromeTabs {
    constructor() {
      this.draggabillyInstances = []
    }

    init(el, options) {
      this.el = el
      this.options = options

      this.setupStyleEl()
      this.setupEvents()
      this.render()
    }

    setupStyleEl() {
      this.animationStyleEl = document.createElement('style')
      this.el.appendChild(this.animationStyleEl)
    }

    setupEvents() {
      window.addEventListener('resize', event => this.render())

      this.el.addEventListener('dblclick', event => this.addNewTab())

      this.el.addEventListener('click', ({target}) => {
        if (target.classList.contains('chrome-tab')) {
          this.setCurrentTab(target)
        } else if (target.classList.contains('chrome-tab-close')) {
          this.closeTab(target.parentNode)
        } else if (target.classList.contains('chrome-tab-title') || target.classList.contains('chrome-tab-favicon')) {
          this.setCurrentTab(target.parentNode)
        }
      })

      // TODO - close tab on middle mouse click
      // TODO - add new tab on middle mouse click
    }

    render() {
      this.fixTabSizes()
      this.fixZIndexes()
      this.setupSortable()
      this.el.dispatchEvent(new CustomEvent('chrome-tabs-render'))
    }

    get tabEls() {
      return Array.prototype.slice.call(this.el.querySelectorAll('.chrome-tab'))
    }

    get tabContentEl() {
      return this.el.querySelector('.chrome-tabs-content')
    }

    get tabRightMargin() {
      return parseInt(getComputedStyle(this.tabEls[0]).marginRight, 10) || -14 // TODO - make an option
    }

    get tabWidth() {
      const marginRight = this.tabRightMargin
      const tabsContentWidth = this.tabContentEl.clientWidth + marginRight
      const width = (tabsContentWidth / this.tabEls.length) - marginRight
      return Math.max(this.options.minWidth, Math.min(this.options.maxWidth, width))
    }

    get tabDistanceApart() {
      return this.tabWidth + this.tabRightMargin
    }

    get tabPositions() {
      const tabDistanceApart = this.tabDistanceApart
      let left = 0
      let positions = []
      this.tabEls.forEach((tabEl, i) => {
        positions.push(left)
        left += tabDistanceApart
      })
      return positions
    }

    fixTabSizes() {
      const tabWidth = this.tabWidth
      this.tabEls.forEach((tabEl) => tabEl.style.width = tabWidth + 'px')
      requestAnimationFrame(() => this.setupAnimationStyles())
    }

    setupAnimationStyles() {
      let styleHTML = ''
      this.tabPositions.forEach((left, i) => {
        // TODO - restrict styles to specific chrome tabs instance
        styleHTML += `
          .chrome-tabs .chrome-tab:nth-child(${ i + 1 }) {
            transform: translate3d(${ left }px, 0, 0)
          }
        `
      })
      this.animationStyleEl.innerHTML = styleHTML
    }

    fixZIndexes() {
      const bottomBarEl = this.el.querySelector('.chrome-tabs-bottom-bar')
      const tabEls = this.tabEls
      tabEls.forEach((tabEl, i) => {
        let zIndex = tabEls.length - i
        if (tabEl.classList.contains('chrome-tab-current')) {
          bottomBarEl.style.zIndex = tabEls.length + 1
          zIndex = tabEls.length + 2
        }
        tabEl.style.zIndex = zIndex
      })
    }

    addNewTab(tabProperties) {
      const div = document.createElement('div')
      div.innerHTML = tabTemplate
      const newTabEl = div.firstElementChild
      this.el.querySelector('.chrome-tabs-content').appendChild(newTabEl)
      tabProperties = Object.assign({}, defaultTapProperties, tabProperties)
      this.updateTab(newTabEl, tabProperties)
      this.setCurrentTab(newTabEl)
    }

    setCurrentTab(tabEl) {
      this.el.querySelector('.chrome-tab-current').classList.remove('chrome-tab-current')
      tabEl.classList.add('chrome-tab-current')
      this.render()
    }

    closeTab(tabEl) {
      if (tabEl.classList.contains('chrome-tab-current')) {
        if (tabEl.previousElementSibling) {
          this.setCurrentTab(tabEl.previousElementSibling)
        } else if (tabEl.nextElementSibling) {
          this.setCurrentTab(tabEl.nextElementSibling)
        }
      }
      tabEl.parentNode.removeChild(tabEl)
      this.render()
    }

    updateTab(tabEl, tabProperties) {
      tabEl.querySelector('.chrome-tab-title').textContent = tabProperties.title
      tabEl.querySelector('.chrome-tab-favicon').style.backgroundImage = `url('${tabProperties.favicon}')`
    }

    setupSortable() {
      const tabEls = this.tabEls
      const tabDistanceApart = this.tabDistanceApart
      const tabPositions = this.tabPositions

      this.draggabillyInstances.forEach(draggabillyInstance => draggabillyInstance.destroy())

      tabEls.forEach((tabEl, originalIndex) => {
        const originalTabPositionX = tabPositions[originalIndex]
        const draggabillyInstance = new Draggabilly(tabEl, {
          axis: 'x',
          containment: '.chrome-tabs'
        })

        this.draggabillyInstances.push(draggabillyInstance);

        draggabillyInstance.on('dragStart', () => {
          tabEl.classList.add('chrome-tab-currently-dragged')
          this.el.classList.add('chrome-tabs-sorting')
          this.fixZIndexes()
        })

        draggabillyInstance.on('dragEnd', () => {
          this.el.querySelector('.chrome-tab-currently-dragged').classList.remove('chrome-tab-currently-dragged')
          this.el.classList.remove('chrome-tabs-sorting')
          this.setCurrentTab(tabEl)
        })

        draggabillyInstance.on('dragMove', (event, pointer, moveVector) => {
          // Current index be computed within the event since it can change during the dragMove
          const tabEls = this.tabEls
          const currentIndex = tabEls.indexOf(tabEl)

          const currentTabPositionX = originalTabPositionX + moveVector.x
          const destinationIndex = Math.floor((currentTabPositionX + (tabDistanceApart / 2)) / tabDistanceApart)

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

  window.ChromeTabs = ChromeTabs
})()
