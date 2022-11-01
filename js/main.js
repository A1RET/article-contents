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
          element.setAttribute('data-id', stepId)
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
  constructor(contentsObj) {
    this.createContentsBlock(contentsObj)
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
    }
  }
}

init();