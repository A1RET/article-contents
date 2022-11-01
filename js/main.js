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

  constructor(contentsObj, contentsBlock) {
    this.contentsObj = contentsObj
    this.contentsBlock = contentsBlock || this.createContentsBlock(contentsObj)

    
    this.initSteps()
    this.toggleItemsState()
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
          const position = target.getBoundingClientRect().top;

          if (self.contentsBlock.classList.contains('post-contents_fixed')) {
            position -= 55;
          }

          window.scrollBy({
            top: position,
            behavior: 'smooth'
          });
        }
      }
    })

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
    const {start,end,percent,contentsItem} = stepProps;
    const progressBlock = contentsItem.querySelector(`[data-progress-step-id="${stepId}"]`);
    const progressBar = progressBlock.querySelector('.post-contents__progress-bar');
    let currentProgress = Math.ceil((currentPos - start) / percent);

    if (currentPos >= end) {
      currentProgress = 100;
    }

    progressBar.style['width'] = `${currentProgress}%`;
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