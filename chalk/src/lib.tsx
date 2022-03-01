import ReactDOM from 'react-dom';
import { compileExpression } from './util';
import ChalkEditor from './ChalkEditor';

interface GlobalState {
  code: string;
  input: any;
  mountingLocation: HTMLDivElement;
  showTool: boolean;
}

const localStorageKey = 'chalk-code';

function getGlobalState(): GlobalState {
  let globalState: GlobalState = (window as any)._LIVE_EDITOR_TOOL_GLOBAL_STATE_;
  if (!globalState) {
    const mountingLocation = document.createElement('div');
    mountingLocation.classList.add("live-editor-tool-mounting-location");
    document.body.append(mountingLocation)

    let code: string = "function (input) {\n  \n}";

    const codeFromLocalStorage = window.localStorage.getItem(localStorageKey)
    if (codeFromLocalStorage) {
      code = codeFromLocalStorage;
    }

    globalState = {
      code,
      input: undefined as any,  // just fill it up fast, ok?
      mountingLocation,
      showTool: false,
    };
    (window as any)._LIVE_EDITOR_TOOL_GLOBAL_STATE_ = globalState;
  }
  return globalState;
}

interface Props {
  input: any;
  showTool?: boolean;
}

export default function liveEditorTool({input, showTool}: Props) {
  const globalState = getGlobalState();

  globalState.input = input;
  globalState.showTool = showTool ?? false;
  update();

  try {
    const compiled = compileExpression(globalState.code);
    const f = compiled({});  // empty environment
    return (f as any)(input);
  } catch {
    return undefined
  }
}

function update() {
  const globalState = getGlobalState();

  if (globalState.showTool) {
    ReactDOM.render(<ChalkEditor
      code={globalState.code}
      setCode={(newCode) => {
        globalState.code = newCode;
        window.localStorage.setItem(localStorageKey, newCode);
        update();
      }}
      input={globalState.input}
      showValues={true}
    />, globalState.mountingLocation)
  } else {
    // TODO: what if it's not mounted yet?
    ReactDOM.unmountComponentAtNode(globalState.mountingLocation);
  }
}