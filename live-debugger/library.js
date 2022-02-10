const split_view = ({ parent = document.createElement('div'), left = parent.childNodes, right = [], /*top, bottom*/ initial_width = '75%' } = {}) => {
  // TODO add top/bottom support using https://github.com/1milligram/html-dom/blob/master/public/demo/create-resizable-split-views/direction.html

  const left_nodes = left.nodeName !== undefined ? [left] : [...left]  // NOTE preserve pointers before mutating below
  const right_nodes = right.nodeName !== undefined ? [right] : [...right]
  const target = parent

  const style_text = `
.container {
display: flex;

/* Misc */

/*border: 1px solid #cbd5e0;
height: 16rem;
width: 100%;*/

}
.container__left {
/* Initially, the left takes 3/4 width */
/*width: 75%;*/

/* Misc */
display: flex;
}
.split-view-resizer {
background-color: #cbd5e0;
cursor: ew-resize;
/*height: 100%;*/
width: 2px;
}
.container__right {
/* Take the remaining width */
flex: 1;

/* Misc */
display: flex;
}`
  const style = document.createElement('style')
  style.classList.add("split-view-style")
  style.innerHTML = style_text


  target.classList.add('container')

  const container = document.createElement('div')
  container.classList.add("container__left")

  container.style.width = initial_width

  target.prepend(container)
  left_nodes.map(c => container.appendChild(c))

  const resizer = html`<div class="split-view-resizer">`
  target.appendChild(resizer)

  const panel = document.createElement('div')
  panel.classList.add("container__right")
  right_nodes.map(c => panel.appendChild(c))

  target.appendChild(panel)

  const leftSide = container
  const rightSide = panel

  // The current position of mouse
  let x = 0;
  let y = 0;
  let leftWidth = 0;

  // Handle the mousedown event
  // that's triggered when user drags the resizer
  const mouseDownHandler = function (e) {
    // Get the current mouse position
    x = e.clientX;
    y = e.clientY;
    leftWidth = leftSide.getBoundingClientRect().width;

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    const newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
    leftSide.style.width = `${newLeftWidth}%`;

    resizer.style.cursor = 'col-resize';
    document.body.style.cursor = 'col-resize';

    leftSide.style.userSelect = 'none';
    leftSide.style.pointerEvents = 'none';

    rightSide.style.userSelect = 'none';
    rightSide.style.pointerEvents = 'none';
  };

  const mouseUpHandler = function () {
    resizer.style.removeProperty('cursor');
    document.body.style.removeProperty('cursor');

    leftSide.style.removeProperty('user-select');
    leftSide.style.removeProperty('pointer-events');

    rightSide.style.removeProperty('user-select');
    rightSide.style.removeProperty('pointer-events');

    // Remove the handlers of `mousemove` and `mouseup`
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };

  // Attach the handler
  resizer.addEventListener('mousedown', mouseDownHandler);

  parent.prepend(style)
  return parent
}

const debugger_interface = async ({ set_state }) => {

  const skypack = (library) => import(`https://cdn.skypack.dev/${library}?min`)
  const html = (await skypack("htl")).html
  const Inspector = (await skypack("@observablehq/inspector@3.2.2/dist/inspector.js")).default.Inspector
  const inspector_style = (await (await fetch('https://raw.githubusercontent.com/observablehq/inspector/main/src/style.css')).text())
  function inspect(value) {
    const root = document.createElement("DIV");
    new Inspector(root).fulfilled(value);
    const element = root.firstChild;
    element.remove();
    element.value = value; // for viewof
    return element;
  }

  const compute_output = (input, text) => {
    let out = undefined
    try {
      out = new Function('return ' + text)()(input)
    } catch (e) {
      //console.log('error object keys: ', Object.getOwnPropertyNames(e))
      // syntax errors work like this in Firefox, not sure about Chrome or other errors
      return new Error(`[line ${e.lineNumber - 2}, column ${e.columnNumber}] ${e.message} ${e.message.includes("got '}'") ? '(unterminated expression)' : ''}`)
    }
    return out
  }
  const output = (inputs, transformation = x => x) => {
    if (!Array.isArray(inputs)) {
      inputs = [inputs]
    }
    if (inputs.some(input => !(input instanceof Element)))
      throw new Error('Argument should be an HTML input (must support .value and .addEventListener).')
    const ui = html`<span class="output">`  // HACK the content has to live somewhere for replaceChildren to work...
    const get_value = () => transformation(...inputs.map(input => input.value))
    let cache = get_value()
    ui.replaceChildren(...[cache])
    inputs.map((input, _) =>
      input.addEventListener('input', e => {
        cache = get_value()
        ui.replaceChildren(...[cache])
        ui.dispatchEvent(new Event('input'))
      }))
    Object.defineProperty(ui, 'value', {
      get: () => cache,
      set: newVal => undefined  // TODO maybe these can be used as primary sources/value stores as well?
    })
    return ui
  }
  const button = (text, cb) => {
    const out = html`<button>${text}</button>`
    out.onclick = cb
    return out
  }
  return async ({ current_input, callback, interactive = true, active = true, code }) => {
    //editor.setOption("readonly", !interactive)
    console.debug('building the editor')
    const editor = await (async () => {
      const { EditorState, EditorView, basicSetup } = await skypack('@codemirror/next/basic-setup')
      const { javascript } = await skypack('@codemirror/next/lang-javascript')

      const updateViewOf = EditorView.updateListener.of((update) => {
        // HACKs here to report state and maintain our state
        const newCode = update.state.doc.toString()
        const { dom } = update.view
        dom.value = newCode
        if (newCode == code) return
        set_state({ code: newCode })
        code = newCode
        dom.dispatchEvent(new CustomEvent('input'))
      })

      const view = new EditorView({
        state: EditorState.create({
          doc: code,
          extensions: [basicSetup, javascript(), updateViewOf, ...(interactive && active ? [] : [EditorView.editable.of(false)])]  // disable editing if not interactive
        })
      })
      view.dom.value = code  // HACK because the value isn't inited
      return view.dom
    })()
    console.debug(current_input, callback, interactive, active)
    if (!interactive) {
      callback(compute_output(JSON.parse(current_input), editor.value))
    }
    console.debug('rendering component', editor)
    const output_temp = output(editor, q => {
      try {
        return compute_output(JSON.parse(current_input), q)
      } catch (e) {
        console.debug(e)
        return e
      }
    })
    console.debug('computed output, now returning html')
    return html`
<div id="livedebug">
Input: <div id="input">${inspect(JSON.parse(current_input))}</div>

<div id="editor">${editor}</div>

Output:
<div id="output">
${output(output_temp, q => q instanceof Error ? q : inspect(q))}
</div>

<div>
${output(output_temp, q =>
      q instanceof Error ? "(Can't send bad output.)"
        : !active || !interactive ? '(viewing mode)'
          : button("Send response", async () => { callback(q); await set_state({ active: false }) }))}

${!interactive ? button("Activate breakpoint", async () => await set_state({ interactive: true }))
        : button("Deactivate breakpoint", async () => await set_state({ interactive: false }))}
</div>
</div>
<style>
#livedebug {
border: 1px solid black
}
#editor {
width: 100%
}
${inspector_style}
.observablehq--inspect {
white-space: pre-wrap
}
</style>
`
  }
}

// (in library)
const skypack = (library) => import(`https://cdn.skypack.dev/${library}?min`)

console.log('getting external library htl')
const html = (await skypack("htl")).html
console.log('got it')

const liveDebugger = async (id, current_input, config) => {
  current_input = JSON.stringify(current_input)
  const storage_name = 'live_debugger_config'

  config = config || JSON.parse(window.localStorage.getItem(storage_name) || "false") || {
    interactive: true,
    code: `function (input) {\n  return input\n}`
  }
  // Mark the component as active
  config.active = true

  const update_local_copy = config =>
    console.debug('(This is where the local copy would be updated.') //fetch(`http://localhost:3000/set?id=${id}&config=${JSON.stringify(config)}`)

  let debugger_div = document.querySelector('#live_debugger')
  if (!debugger_div) {
    debugger_div = html`<div id="live_debugger"></div>`
    split_view({ parent: document.body, left: document.body.childNodes, right: debugger_div })
    //document.body.appendChild(debugger_div)
  }

  let resolve = undefined
  const p = new Promise(r => resolve = r)

  const set_state = async update => {
    //console.log('applying update', update)
    config = { ...config, ...update }
    window.localStorage.setItem(storage_name, JSON.stringify(config))
    console.debug('new state', config)

    if (!update.code) // don't rerender on code changes (or on output)
      render_into_div(debugger_div)
    //debugger_div.replaceChildren(await render({ callback: o => resolve(o), current_input, ...config }))

    update_local_copy(config)
  }

  //console.log('getting debugger interface')
  const render = await debugger_interface({ set_state, code: config.code, interactive: config.interactive })
  const render_into_div = async div => debugger_div.replaceChildren(await render({ callback: o => resolve(o), current_input, ...config }))

  //console.log('initially rendering debugger')
  render_into_div(debugger_div)
  //debugger_div.replaceChildren(await render({ callback: o => resolve(o), current_input, ...config }))
  console.debug('rendered')
  return p
}

export { liveDebugger, html}