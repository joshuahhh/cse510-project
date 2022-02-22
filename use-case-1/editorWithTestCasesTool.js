import { html } from 'https://cdn.skypack.dev/htl'
import inspector from 'https://cdn.skypack.dev/@observablehq/inspector@3.2.2/dist/inspector.js'
const Inspector = inspector.Inspector

import { EditorState, EditorView, basicSetup } from 'https://cdn.skypack.dev/@codemirror/next/basic-setup'
import { javascript } from 'https://cdn.skypack.dev/@codemirror/next/lang-javascript'

let retval;

const split_view = ({ parent = document.createElement('div'), left = parent.childNodes, right = [], /*top, bottom*/ initial_width = '75%' } = {}) => {

  const left_nodes = left.nodeName !== undefined ? [left] : [...left]  // NOTE preserve pointers before mutating below
  const right_nodes = right.nodeName !== undefined ? [right] : [...right]
  const target = parent

  const style_text = `
.container {
  display: flex;
}
.container__left {
  min-width: 550px;
  max-width: 60vw;
}
.split-view-resizer {
  background-color: #cbd5e0;
  cursor: ew-resize;
  width: 6px;
}
/* resize indicator handle */
.split-view-resizer::after {
  content: "...";
  font-family: "Calibri";
  letter-spacing: 1px;
  writing-mode: vertical-rl;
  position: absolute;
  border-radius: 100px;
  top: 50%;
  text-align: center;
  transform: translate(-3px, -50%);
  background: #cbd5e0;
  padding: 17px 0;
  width: 12px;
  line-height: 2px;
  color: #556A82;
}
.container__right {
  flex: 1;
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


const debugger_interface = ({ set_state }) => {

  //const skypack = (library) => import(`https://cdn.skypack.dev/${library}?min`)
  //const html = (await skypack("htl")).html

  //const Inspector = (await skypack("@observablehq/inspector@3.2.2/dist/inspector.js")).default.Inspector
  //const inspector_style = (await (await fetch('https://raw.githubusercontent.com/observablehq/inspector/main/src/style.css')).text())
  function inspect(value) {
    return html`<pre>${JSON.stringify(value, null, 2)}</pre>`
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
      set: newVal => undefined
    })
    return ui
  }
  const button = (text, cb) => {
    const out = html`<button>${text}</button>`
    out.onclick = cb
    return out
  }
  return ({ current_input, callback, interactive = true, active = true, code, history = [], expected = [], keep=[] }) => {

    //editor.setOption("readonly", !interactive)
    console.debug('building the editor')
    const editor = (() => {

      const updateViewOf = EditorView.updateListener.of((update) => {
        // HACKs here to report state and maintain our state
        const newCode = update.state.doc.toString()
        const { dom } = update.view
        dom.value = newCode
        if (newCode == code) return
        set_state({ code: newCode }, true)
        code = newCode
        dom.dispatchEvent(new CustomEvent('input'))
      })

      const view = new EditorView({
        state: EditorState.create({
          doc: code,
          extensions: [basicSetup, javascript(), updateViewOf] // actually enable, ...(interactive && active ? [] : [EditorView.editable.of(false)])]  // disable editing if not interactive
        })
      })
      view.dom.value = code  // HACK because the value isn't inited
      return view.dom
    })()
    console.debug(current_input, callback, interactive, active)

    retval = compute_output(JSON.parse(current_input), editor.value)
    if (!(history[0]?.input == current_input)) {
      console.log('fixing history')
      //const no_keep = history.filter((e, i) => !history[i].keep)
      const keepers = history.filter((e, i) => history[i].keep && history[i].input != current_input)
      const first = history.find(e => e.input == current_input) || { input: current_input }
      setTimeout(() => set_state({ history: [first, ...keepers] }))
      return undefined  // render nothing, will rerender momentarily
    }
    if (!interactive) {
      console.log("calling callback", current_input, editor.value)

      //callback(compute_output(JSON.parse(current_input), editor.value))
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

    const general_output = input => output(editor, q => {
      try {
        return compute_output(JSON.parse(input), q)
      } catch (e) {
        return e
      }
    })

    console.debug('computed output, now returning html')
    console.log(history)
    // history = []  // of inputs?
    // expected = []  // of values? store as an object like {value} to avoid ambiguity about expected undefined

    const expected_changed = html`<input>`
    const inputs_refs = {}
    const expected_input = i => {
      const el = html`<input>`
      el.value = history[i].expected ? JSON.stringify(history[i].expected.value) : ''
      el.oninput = () => {
        try {
          history[i].expected = { value: JSON.parse(el.value) }
          set_state({ history }, true)
        } catch (e) {
          history[i].expected = undefined
          set_state({ history }, true)
        }
        expected_changed.dispatchEvent(new CustomEvent('input'))
      }
      inputs_refs[i] = el
      return el
    }

    const remove_expected = i => {
      const el = html`<button>Modify</button>`
      el.onclick = () => {
        delete history[i].expected
        set_state({ history })
      }
      return el
    }

    const toggle_keep = i => {
      const el = html`<input type="checkbox" >`
      el.checked = history[i].keep
      el.onclick = () => {
        history[i].keep = el.checked
        const current = history.find(e => e.input == current_input)
        history = history.filter(v => v.input != current_input)
        //const no_keep = history.filter((e, i) => !history[i].keep)
        const keepers = history.filter((e, i) => history[i].keep)
        set_state({ history: [current, ...keepers] })
        //set_state({ keep })
      }
      return el
    }

    return html`
<div id="livedebug">
<div class="livedebug-top">
<div id="inputBox">
Input: <div id="input">${inspect(JSON.parse(current_input))}</div>
</div>
<div id="editor">${editor}</div>
<div id="outputBox">
Output:
<div id="output">
${output(output_temp, q => q instanceof Error ? q : inspect(q))}
</div>
</div>

<div style="display: none"> <!-- not allowing toggle right now -->
  ${output(output_temp, q =>
        q instanceof Error ? "(Can't send bad output.)"
          : !active || !interactive ? '(viewing mode)'
            : button("Send response", async () => { callback(q); await set_state({ active: false }) }))}

  ${!interactive ? button("Activate breakpoint", async () => await set_state({ interactive: true }))
          : button("Deactivate breakpoint", async () => await set_state({ interactive: false }))}
</div>
</div>
<div id="testTable" class="livedebug-table">
<table>
<thead>
<tr>
  <th>Keep</th>
  <th>Input</th>
  <th>Expected JSON</th>
  <th>Output</th>
  <th>Match?</th>
</tr>
</thead>
<tbody>
${history.map((item, i) =>
  html.fragment`
  <tr>
    <td>${toggle_keep(i)}</td>
    <td>${inspect(JSON.parse(item.input))}</td>
    <td>${expected_input(i)} ${output(expected_changed, _ => {
      console.log(inputs_refs[i].value)
      if (inputs_refs[i].value != "") {
        try {
          console.log(inputs_refs[i].value)
          JSON.parse(inputs_refs[i].value)
          return ''
        } catch (e) {
          return html`<span style="color:red"> parse failed</span>`
        }
      } else return ''
    })}</td>
    <td>${output(general_output(item.input), out => out instanceof Error ? out.message : inspect(out))}</td>
    <td>${output([general_output(item.input), expected_changed], out => !item.expected ? '' : JSON.stringify(item.expected.value) == JSON.stringify(out) ? html`<span style="background-color: lightgreen">true</span>` : html`<span style="background-color: salmon">false</span>`)}</td>
  </tr>
  `
)}
</tbody>
</table>
</div>
</div>

</div>
<link rel="stylesheet" href="./editorWithTestCasesTool.css">
<style>
#inputBox, #outputBox, #editor {
  margin-bottom: 16px;
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(20,20,20,0.2);
}

#testTable table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
td, th {
  padding: 4px 15px;
  text-align: left;
}
td {
  border-left: 1px solid #cbd5e0;
  border-bottom: 1px solid #cbd5e0;
}
thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #cbd5e0;
}
/* Keep column and Match? column */
td:first-of-type, td:last-of-type {
  text-align: center;
  width: 0;
  white-space: nowrap;
}
td:first-of-type input[type=checkbox] {
  transform: scale(1.5);
}
td input {
  width: 100%;
  font: inherit;
  font-family: monospace;
}
td .output span {
  padding: 4px 8px;
  border-radius: 4px;
}

#livedebug {
  padding: 16px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F0F2F5;
}
.livedebug-table {
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 0 3px rgba(20,20,20,0.2);
}
#editor {
  width: 100%;
  padding-top: 0;
  padding-bottom: 0;
}
#editor > div {
  outline: 0;
}
#livedebug pre {
  margin-top: 0px;
  margin-bottom: 0px;
}

.observablehq--inspect {
white-space: pre-wrap;
display: inline;
}
</style>
`
  }
}

// (in library)
//const skypack = (library) => import(`https://cdn.skypack.dev/${library}?min`)

//console.log('getting external library htl')
//const html = (await skypack("htl")).html
//console.log('got it')

const editorWithTestCasesTool = ({ input, showTool = false }, config) => {
  let current_input = JSON.stringify(input)

  const storage_name = 'live_debugger_config::' + window.location.href

  config = config || JSON.parse(window.localStorage.getItem(storage_name) || "false") || {
    interactive: true,
    code: `function (input) {\n  return input\n}`
  }
  // Mark the component as active
  config.active = true

  const update_local_copy = config =>
    console.debug('(This is where the local copy would be updated.') //fetch(`http://localhost:3000/set?id=${id}&config=${JSON.stringify(config)}`)

  if (!document.querySelector('style#live_debugger')) {
    document.head.appendChild(html`<style id="live_debugger">
                                  #live_debugger {
                                    width: 100%;
                                    max-width: calc(100vw - 556px);
                                  }
                                </style>`)
  }

  let debugger_div = document.querySelector('div#live_debugger')
  if (!debugger_div && showTool) {
    document.head.appendChild(html`<link rel="stylesheet" href="./editorWithTestCasesTool.css"></link>`)
    debugger_div = html`<div id="live_debugger"></div>`
    split_view({ parent: document.body, left: document.body.childNodes, right: debugger_div })
    //document.body.appendChild(debugger_div)
  }

  // let resolve = undefined
  // const p = new Promise(r => resolve = r)

  const set_state = (update, noRerender=false) => {
    //console.log('applying update', update)
    config = { ...config, ...update }
    window.localStorage.setItem(storage_name, JSON.stringify(config))
    console.debug('new state', config, update)

    if (!noRerender) {
      console.log(render)
      render_into_div(debugger_div)
    }
    //debugger_div.replaceChildren(await render({ callback: o => resolve(o), current_input, ...config }))

    update_local_copy(config)
  }

  //console.log('getting debugger interface')
  const render = debugger_interface({ set_state, code: config.code, interactive: config.interactive })
  const render_into_div = div => {
    //console.log("HERE!", render)
    const torender = render({ callback: o => resolve(o), current_input, ...config })
    //console.log(torender)
    showTool && torender ? div.replaceChildren(torender): undefined
  }

  //console.log('initially rendering debugger')
  render_into_div(debugger_div)
  //debugger_div.replaceChildren(await render({ callback: o => resolve(o), current_input, ...config }))
  console.debug('rendered')
  return retval
}

export { editorWithTestCasesTool, html }