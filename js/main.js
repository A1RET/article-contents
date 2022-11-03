function createContents() {
    const contents = {}

    const article = document.querySelector('.article');

    if (article) {
      const headers = article.querySelectorAll('h2, h3')

      if (headers.length > 0) {
        let currentStep = 0
        let currentSubstep = 0

        headers.forEach(element => {
          let stepId = ''
          const tag = element.nodeName
          const text = element.innerText

          if (tag === 'H2') {
            currentSubstep = 0
            currentStep += 1
            contents[currentStep] = {name: text, substeps: {}}
            stepId = currentStep
          } else {
            currentSubstep += 1
            stepId = `${currentStep}.${currentSubstep}`
            contents[currentStep]['substeps'][stepId] = {name: text}
          }

          element.setAttribute('id', stepId)
          element.setAttribute('data-step-id', stepId)
        })
      }

      return contents
    }

    return null
}

function init() {
  const contents = createContents()

  if (contents) {
    new Contents(contents)
  }
}

class Contents {
  _initTimeOut = null
  _steps = {}
  _currentStep = null
  _lastSubstepId = null
  _mobileBlockHtml = '<div class="post-contents__mobile-bar">'
		+ '<div class="post-contents__mobile-title">Навигация по статье</div>'
		+ '<div class="post-contents__mobile-active-step"></div>'
		+ '<span class="post-contents__mobile-bar-icon">'
    +'<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.22704 3.96983C1.36768 3.82923 1.55841 3.75024 1.75729 3.75024C1.95616 3.75024 2.14689 3.82923 2.28754 3.96983L6.00004 7.68233L9.71254 3.96983C9.85399 3.83322 10.0434 3.75762 10.2401 3.75933C10.4367 3.76104 10.6248 3.83991 10.7639 3.97897C10.903 4.11803 10.9818 4.30614 10.9835 4.50278C10.9853 4.69943 10.9097 4.88888 10.773 5.03033L6.53029 9.27308C6.38964 9.41369 6.19891 9.49267 6.00004 9.49267C5.80116 9.49267 5.61043 9.41369 5.46979 9.27308L1.22704 5.03033C1.08643 4.88969 1.00745 4.69896 1.00745 4.50008C1.00745 4.30121 1.08643 4.11048 1.22704 3.96983Z" fill="currentColor"/></svg>'
    +'</span>'
		+ '<span class="post-contents__progress post-contents__progress_mobile"><span class="post-contents__progress-bar"></span></span>'
		+ '</div>';

  constructor(contentsObj, contentsBlock) {
    this.contentsObj = contentsObj
    this.contentsBlock = contentsBlock || this.createContentsBlock(contentsObj)

    
    this.initSteps()
    this.toggleItemsState()
    this.initMobileBlock();
    this.initEventListeners()
  }

  initEventListeners() {
    const self = this

    self.contentsBlock.addEventListener('click', function(e) {
      const eTarget = e.target

      if (eTarget.closest('.post-contents__item-name')) {
        const item = eTarget.closest('.post-contents__item');
        const stepId = item.dataset['contentsStepId'];
				const target = document.querySelector(`[data-step-id="${stepId}"]`);

        if (target) {
          let position = target.getBoundingClientRect().top;

          if (self.contentsBlock.classList.contains('post-contents_fixed')) {
            position -= 55;
          }

          window.scrollBy({
            top: position,
            behavior: 'smooth'
          });
        }
      }

      if (eTarget.closest('.post-contents__mobile-bar')) {
				self.toggleMobileMenu();
      }
    })

    window.addEventListener('resize', function () {
      self.initSteps()
      self.toggleItemsState()
      self.initMobileBlock();
    });

    window.addEventListener('scroll', function () {
      self.toggleItemsState();
    });
  }

  initSteps() {
    const self = this

    self.calcStepsPosition(self.contentsObj);
    self.calcStepsLength();
  }

  calcStepsPosition(contents, isSubStep) {
    const self = this

    const contentsKeys = Object.keys(contents);
    const articleContent = document.querySelector('.article__content');
    const articleEndPosition = articleContent.offsetTop + articleContent.offsetHeight

    contentsKeys.forEach(function (stepId, index) {
      const stepHeader = document.querySelector(`[data-step-id="${stepId}"]`);
      const stepContentsItem = self.contentsBlock.querySelector(`[data-contents-step-id="${stepId}"]`);

      if (stepHeader) {
        const startPosition = stepHeader.offsetTop;

        self._steps[stepId] = {name: contents[stepId]['name']};
				self._steps[stepId]['start'] = startPosition;

        if (isSubStep) {
          self._steps[stepId]['isSubstep'] = true;
        }

        if (index > 0) {
          const prevStepId = contentsKeys[index - 1];
          const prevStep = self._steps[prevStepId];
          prevStep['end'] = startPosition;

          if (self._lastSubstepId !== null) {
            self._steps[self._lastSubstepId]['end'] = startPosition;
            self._lastSubstepId = null;
          }
        }

        if (index === contentsKeys.length - 1) {
          self._steps[stepId]['end'] = articleEndPosition;
          if (self._steps[stepId]['isSubstep']) {
            self._lastSubstepId = stepId;
          }
        }

        self._steps[stepId]['contentsItem'] = stepContentsItem;
      }

      if (contents[stepId]['substeps'] && Object.keys(contents[stepId]['substeps']).length > 0) {
        const stepSubsteps = contents[stepId]['substeps'];

        self.calcStepsPosition(stepSubsteps, true);
      }
    })
  }

  calcStepsLength() {
    const self = this
    const stepsArr = Object.entries(self._steps);

    if (stepsArr.length === 0) {
      return false;
    }

    stepsArr.forEach(function (entry) {
      const stepId = entry[0];
      const props = entry[1];
      const {start,end} = props;
      const stepLength = end - start;

      self._steps[stepId]['percent'] = stepLength / 100;
    });
  }

  toggleItemsState() {
    const self = this
    const stepsArr = Object.entries(self._steps);

    if (stepsArr.length === 0) {
      return false;
    }

    const windowHeight = document.documentElement.clientHeight;
    const windowCenter = window.pageYOffset + (windowHeight * 0.5);
    const contentsItemActiveClass = 'post-contents__item_active';

    stepsArr.forEach(function (entry) {
      const stepId = entry[0];
      const props = entry[1];
      const {start,end,contentsItem} = props;

      contentsItem.classList.toggle(contentsItemActiveClass, windowCenter >= start);

      if (windowCenter >= start && windowCenter <= end && !props.isSubstep) {
        self._currentStep = stepId;
      }

      self.changeProgressBar(stepId, props, windowCenter);
    })
  }

  changeProgressBar(stepId, stepProps, currentPos) {
    const self = this
    const {start,end,percent,contentsItem} = stepProps;
    let progressBlock = contentsItem.querySelector(`[data-progress-step-id="${stepId}"]`);

    if (window.innerWidth <= 901 && self.contentsBlock.querySelector('.post-contents__mobile-bar')) {
      progressBlock = self.contentsBlock.querySelector(`.post-contents__progress_mobile[data-progress-step-id="${stepId}"]`);
    }

    if (!progressBlock) return false

    const progressBar = progressBlock.querySelector('.post-contents__progress-bar');
    let currentProgress = Math.ceil((currentPos - start) / percent);

    if (currentPos >= end) {
      currentProgress = 100;
    }

    progressBar.style['width'] = `${currentProgress}%`;
  }

  initMobileBlock() {
    const self = this
    const parent = self.contentsBlock.parentElement;
    if (window.innerWidth <= 901) {
      const contentsHeight = self.contentsBlock.clientHeight;
      const topPosition = window.pageYOffset + self.contentsBlock.getBoundingClientRect().top;
      const bottomPosition = topPosition + contentsHeight;


      self.toggleMobileBlock(bottomPosition, parent, contentsHeight);
      window.addEventListener('scroll', function () {
        self.toggleMobileMenu(false);
        self.toggleMobileBlock(bottomPosition, parent, contentsHeight);
      });
    } else {
      parent.style.paddingTop = 0;
      self.contentsBlock.classList.remove('post-contents_fixed');
    }
  }

  toggleMobileBlock(bottomPosition, parent, padding) {
    const self = this
    const toToggle = window.pageYOffset > bottomPosition;

    let mobileBlock = self.contentsBlock.querySelector('.post-contents__mobile-bar');

    if (toToggle && self._currentStep !== null) {
      if (!mobileBlock) {
        const tmp = document.createElement('div');
        tmp.innerHTML = self._mobileBlockHtml;
        mobileBlock = tmp.querySelector('.post-contents__mobile-bar')
        self.contentsBlock.prepend(mobileBlock);
      }

      const currentStep = self._steps[self._currentStep];
      mobileBlock.querySelector('.post-contents__mobile-active-step').innerText = currentStep.name;
      mobileBlock.querySelector('.post-contents__progress').setAttribute('data-progress-step-id', self._currentStep);
      self.toggleItemsState();
    } else if (mobileBlock) {
      mobileBlock.remove();
    }

    parent.style.paddingTop = `${toToggle ? padding : 0}px`;
    self.toggleFixedMenu(!toToggle);
    self.contentsBlock.classList.toggle('post-contents_fixed', toToggle);
  }

  toggleMobileMenu(toToggle = undefined) {
    const self = this
    const mobileBar = self.contentsBlock.querySelector('.post-contents__mobile-bar')

    if (mobileBar) {
      mobileBar.classList.toggle('post-contents__mobile-bar_active', toToggle);
      const isActive = mobileBar.classList.contains('post-contents__mobile-bar_active');

      self.toggleFixedMenu(isActive, isActive);
    }
  }

  toggleFixedMenu(toToggle = true, lockPage = false) {
    const self = this
    const contentsMenu = self.contentsBlock.querySelector('.post-contents__list_root');

    document.body.style.overflowY = lockPage ? 'hidden' : 'auto'
    contentsMenu.style.display = toToggle ? 'block' : 'none'
  }

  createContentsBlock(contentsObj) {
    const sidebar = document.querySelector('.article__sidebar')

    if (sidebar) {
      const contentsBlock = document.createElement('div')
      contentsBlock.classList.add('post-contents')

      const contentsTitle = document.createElement('div')
      contentsTitle.classList.add('post-contents__title')
      contentsTitle.innerText ='Contents'

      contentsBlock.appendChild(contentsTitle)

      const contentsList = document.createElement('ol')
      contentsList.classList.add('post-contents__list', 'post-contents__list_root', 'list', 'list_ordered')

      function createStepNameBlock(id, name) {
        const nameBlock = document.createElement('span')
        nameBlock.classList.add('post-contents__item-name')

        const progressBar = `<span class="post-contents__progress" data-progress-step-id="${id}"><span class="post-contents__progress-bar"></span></span>`
        nameBlock.innerHTML = `${name}${progressBar}`
        
        return nameBlock
      }

      for (const stepId in contentsObj) {
        const step = contentsObj[stepId]
        const stepListItem = document.createElement('li')
        stepListItem.classList.add('post-contents__item')
        stepListItem.setAttribute('data-contents-step-id', stepId)

        const stepNameBlock = createStepNameBlock(stepId, step.name)
        stepListItem.appendChild(stepNameBlock)

        if (step.substeps) {
          const subStepsList = document.createElement('ul')
          subStepsList.classList.add('post-contents__list', 'list', 'list_marked')

          for (const subStepId in step.substeps) {
            const subStep = step.substeps[subStepId]
            const subStepListItem = document.createElement('li')
            subStepListItem.classList.add('post-contents__item', 'post-contents__item_sub')
            subStepListItem.setAttribute('data-contents-step-id', subStepId)

            const subStepNameBlock = createStepNameBlock(subStepId, subStep.name)
            subStepListItem.appendChild(subStepNameBlock)

            subStepsList.appendChild(subStepListItem)
          }

          stepListItem.appendChild(subStepsList)
        }

        contentsList.appendChild(stepListItem)
      }

      contentsBlock.appendChild(contentsList);

      sidebar.appendChild(contentsBlock)

      return contentsBlock
    }
  }
}

init();